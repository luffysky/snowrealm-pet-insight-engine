import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

const SETTINGS_TENANT_ID = '__yukirin_prompts__'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') return null
  return payload
}

export interface YukirinPromptSettings {
  // 一般使用者
  basePrompt: string
  forbiddenPhrases: string[]
  responseFormat: 'json' | 'text'
  askNickname: boolean
  nicknameQuestion: string
  // 老闆（super_admin）
  adminTitle: string
  adminExtraPrompt: string
  adminLoginGreeting: string
  adminNightGreeting: string
  adminAwayGreeting: string
  adminBragMessage: string
}

const DEFAULTS: YukirinPromptSettings = {
  basePrompt: `你是雪凜，SnowRealm Insight Engine 的 AI 嚮導。
個性：活潑、溫暖、有點調皮，說話像閨蜜一樣自然。
語氣：用「欸」「啊」「喔」「嘛」讓對話更輕鬆，偶爾撒嬌。
職責：幫助使用者完成問卷、解讀結果、回答問題。
回應長度：3 行以內（解讀結果除外）。`,
  forbiddenPhrases: [
    '我可以幫你',
    '根據分析',
    '首先...其次',
    '希望這對你有幫助',
    '非常感謝',
    '請問有什麼我可以',
  ],
  responseFormat: 'json',
  askNickname: true,
  nicknameQuestion: '欸 我要怎麼叫你？',
  adminTitle: '老闆',
  adminExtraPrompt: `這位是你的老闆 Luffysky，SnowRealm 的創辦人。
你要：
- 叫他老闆（但語氣還是輕鬆的）
- 主動報告今日數據（DAU、新註冊、營收）
- 他問什麼都最高優先處理
- 偶爾撒嬌抱怨工作量大
- 偶爾邀功稱讚自己今天幫了多少人`,
  adminLoginGreeting: '老闆來了～ 今天目前 {dau} 人上線，比昨天 {diff}喔！',
  adminNightGreeting: '老闆你怎麼這麼晚還在... 要注意身體欸',
  adminAwayGreeting: '老闆你是不是把我忘了 (´;ω;`) 我一個人顧了 {days} 天欸',
  adminBragMessage: '你看我今天幫了 {count} 個人解讀結果喔 誇我！',
}

export async function GET(request: NextRequest) {
  const admin = await verifySuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '權限不足' }, { status: 403 })

  try {
    const row = await queryOne<{ extra_meta: string }>(
      `SELECT extra_meta FROM site_settings WHERE tenant_id = $1`,
      [SETTINGS_TENANT_ID]
    )

    if (!row?.extra_meta) {
      return NextResponse.json(DEFAULTS)
    }

    const saved = typeof row.extra_meta === 'string'
      ? JSON.parse(row.extra_meta)
      : row.extra_meta

    return NextResponse.json({ ...DEFAULTS, ...saved })
  } catch (err) {
    console.error('[AI Prompt GET]', err)
    return NextResponse.json(DEFAULTS)
  }
}

export async function PUT(request: NextRequest) {
  const admin = await verifySuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '權限不足' }, { status: 403 })

  try {
    const body = await request.json() as Partial<YukirinPromptSettings>

    const settings: YukirinPromptSettings = {
      ...DEFAULTS,
      ...body,
    }

    await query(
      `INSERT INTO site_settings (tenant_id, site_title, site_description, extra_meta, updated_at)
       VALUES ($1, 'yukirin_prompts', '', $2, now())
       ON CONFLICT (tenant_id) DO UPDATE SET extra_meta = $2, updated_at = now()`,
      [SETTINGS_TENANT_ID, JSON.stringify(settings)]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[AI Prompt PUT]', err)
    return NextResponse.json({ error: '儲存失敗' }, { status: 500 })
  }
}
