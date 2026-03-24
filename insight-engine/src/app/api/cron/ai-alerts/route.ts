import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { pushLineMessage } from '@/lib/line'

const CRON_SECRET = process.env.CRON_SECRET

interface AlertSurveyRow extends Record<string, unknown> {
  survey_id: string
  survey_title: string
  tenant_id: string
  total_24h: string
  completed_24h: string
  abandoned_7d: string
  total_7d: string
}

interface AlertResult {
  survey_title: string
  issues: string[]
  completionRate24h: number
  abandonRate7d: number
}

function verifyCronAuth(request: NextRequest): boolean {
  if (!CRON_SECRET) return true
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${CRON_SECRET}`
}

function buildAlertMessage(alerts: AlertResult[]): string {
  const lines = [
    `🚨 問卷異常預警（${new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' })}）`,
    '',
  ]
  for (const a of alerts) {
    lines.push(`📋 ${a.survey_title}`)
    for (const issue of a.issues) {
      lines.push(`  ⚠️ ${issue}`)
    }
    lines.push('')
  }
  lines.push('請前往後台查看詳情並採取優化措施。')
  return lines.join('\n')
}

/**
 * GET/POST /api/cron/ai-alerts
 * 每日檢查異常指標（完成率偏低、棄卷率飆升），並透過 LINE 推播預警給管理員
 * 由 Zeabur Cron 排程呼叫
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleAlerts(request)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleAlerts(request)
}

async function handleAlerts(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query<AlertSurveyRow>(
      `SELECT
         s.id       AS survey_id,
         s.title    AS survey_title,
         s.tenant_id,
         COUNT(*) FILTER (WHERE r.created_at > NOW() - INTERVAL '24 hours')::text          AS total_24h,
         COUNT(*) FILTER (WHERE r.status = 'completed' AND r.created_at > NOW() - INTERVAL '24 hours')::text AS completed_24h,
         COUNT(*) FILTER (WHERE r.status = 'abandoned' AND r.created_at > NOW() - INTERVAL '7 days')::text   AS abandoned_7d,
         COUNT(*) FILTER (WHERE r.created_at > NOW() - INTERVAL '7 days')::text            AS total_7d
       FROM surveys s
       JOIN responses r ON r.survey_id = s.id
       WHERE s.status = 'active'
       GROUP BY s.id, s.title, s.tenant_id
       HAVING COUNT(*) FILTER (WHERE r.created_at > NOW() - INTERVAL '24 hours') >= 5`
    )

    const alerts: AlertResult[] = []

    for (const row of rows) {
      const total24h = parseInt(row.total_24h, 10)
      const completed24h = parseInt(row.completed_24h, 10)
      const abandoned7d = parseInt(row.abandoned_7d, 10)
      const total7d = parseInt(row.total_7d, 10)

      const completionRate24h = total24h > 0 ? (completed24h / total24h) * 100 : 100
      const abandonRate7d = total7d > 0 ? (abandoned7d / total7d) * 100 : 0

      const issues: string[] = []

      if (completionRate24h < 50) {
        issues.push(`過去 24 小時完成率偏低（${completionRate24h.toFixed(1)}%）`)
      }
      if (abandonRate7d > 40) {
        issues.push(`過去 7 天棄卷率偏高（${abandonRate7d.toFixed(1)}%）`)
      }

      if (issues.length > 0) {
        alerts.push({
          survey_title: row.survey_title,
          issues,
          completionRate24h,
          abandonRate7d,
        })
      }
    }

    if (alerts.length > 0) {
      const message = buildAlertMessage(alerts)
      try {
        await pushLineMessage([{ type: 'text', text: message }])
      } catch (lineErr) {
        console.error('[ai-alerts] LINE push failed:', lineErr)
      }

      // 記錄到 notification_logs
      try {
        await query(
          `INSERT INTO notification_logs (rule_id, trigger_type, recipient_type, recipient_id, status)
           VALUES (NULL, 'ai_alert', 'admin', 'all_admins', 'sent')`
        )
      } catch (logErr) {
        console.error('[ai-alerts] Log insert failed:', logErr)
      }
    }

    return NextResponse.json({
      ok: true,
      checkedSurveys: rows.length,
      alertCount: alerts.length,
      alerts: alerts.map((a) => ({ survey: a.survey_title, issues: a.issues })),
    })
  } catch (error) {
    console.error('[ai-alerts] Error:', error)
    return NextResponse.json({ error: 'AI 預警檢查失敗' }, { status: 500 })
  }
}
