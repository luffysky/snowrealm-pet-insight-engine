import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { requireRole } from '@/lib/tenant'
import { checkSurveyLimit } from '@/lib/planLimits'
import { createSurvey, updateSurvey } from '@/lib/surveyRepo'

interface TemplateRow extends Record<string, unknown> {
  id: string
  name: string
  survey_config: unknown
  questions: unknown
  branch_config: unknown
}

interface SurveyConfigData {
  title?: string
  subtitle?: string
  cover_title?: string
  cover_subtitle?: string
  start_button_text?: string
  done_title?: string
  done_subtitle?: string
}

interface QuestionData {
  key: string
  type: string
  content: string
  options?: unknown
  is_required?: boolean
  max_selections?: number | null
  route?: string | null
  chapter?: string | null
  emoji?: string | null
  narrative?: string | null
}

// POST /api/admin/survey-templates/[id]/use
// 從模板一鍵建立完整問卷
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId, userId } = roleCheck
  const { id } = await params

  // 檢查問卷數量限制
  const surveyLimit = await checkSurveyLimit(tenantId, userId)
  if (!surveyLimit.allowed) {
    return NextResponse.json({ error: '已達方案問卷數量上限，請升級方案' }, { status: 403 })
  }

  // 取得模板（包括平台模板、自己的租戶模板、公開市集模板）
  const template = await queryOne<TemplateRow>(
    `SELECT id, name, survey_config, questions, branch_config
     FROM survey_templates
     WHERE id = $1 AND is_active = true
       AND (source = 'platform' OR tenant_id = $2 OR (source = 'marketplace' AND is_public = true))`,
    [id, tenantId]
  )
  if (!template) {
    return NextResponse.json({ error: '模板不存在或無權限' }, { status: 404 })
  }

  // 解析模板資料
  const surveyConfig = (
    typeof template.survey_config === 'string'
      ? JSON.parse(template.survey_config)
      : template.survey_config
  ) as SurveyConfigData

  const questions = (
    typeof template.questions === 'string'
      ? JSON.parse(template.questions)
      : template.questions
  ) as QuestionData[]

  const branchConfig: Record<string, unknown> | null = template.branch_config
    ? (typeof template.branch_config === 'string'
        ? (JSON.parse(template.branch_config) as Record<string, unknown>)
        : (template.branch_config as Record<string, unknown>))
    : null

  // 生成唯一 slug：從模板名稱取前綴 + 隨機 6 碼
  const baseSlug = template.name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'survey'

  const randomSuffix = Math.random().toString(36).slice(2, 8)
  const slug = `${baseSlug}-${randomSuffix}`

  const title = surveyConfig.title ?? template.name

  try {
    // 建立問卷主記錄
    const survey = await createSurvey({ title, slug, tenantId })

    // 套用模板的其他設定
    await updateSurvey(survey.id, {
      subtitle: surveyConfig.subtitle ?? '',
      cover_title: surveyConfig.cover_title ?? title,
      cover_subtitle: surveyConfig.cover_subtitle ?? '',
      start_button_text: surveyConfig.start_button_text ?? '開始填寫',
      done_title: surveyConfig.done_title ?? '感謝您的填寫！',
      done_subtitle: surveyConfig.done_subtitle ?? '您的回覆已成功送出',
      ...(branchConfig ? { branch_config: branchConfig } : {}),
    })

    // 批量建立題目
    if (Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        await execute(
          `INSERT INTO questions
             (id, survey_id, key, type, content, options, order_index, is_required,
              max_selections, route, chapter, emoji, narrative)
           VALUES
             (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            survey.id,
            q.key,
            q.type ?? 'single',
            q.content ?? '',
            JSON.stringify(q.options ?? []),
            i,
            q.is_required ?? true,
            q.max_selections ?? null,
            q.route ?? null,
            q.chapter ?? null,
            q.emoji ?? null,
            q.narrative ?? null,
          ]
        )
      }
    }

    // 增加模板使用次數
    await execute(
      `UPDATE survey_templates SET use_count = use_count + 1 WHERE id = $1`,
      [id]
    )

    return NextResponse.json({ surveyId: survey.id, slug: survey.slug }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[survey-templates/[id]/use POST]', err)
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json({ error: '問卷 slug 衝突，請重試' }, { status: 409 })
    }
    return NextResponse.json({ error: '從模板建立問卷失敗' }, { status: 500 })
  }
}
