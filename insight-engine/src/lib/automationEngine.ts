/**
 * 自動化觸發引擎
 * 在問卷提交後檢查觸發條件，執行對應動作
 */
import { query, queryOne, execute } from '@/lib/db'
import { pushLineMessage } from '@/lib/line'
import { buildInsightSummary, generateInsightReport } from '@/lib/insightEngine'
import { getActiveAiKey, getPlatformKey } from '@/lib/aiService'

interface AutomationRule extends Record<string, unknown> {
  id: string
  tenant_id: string
  survey_id: string | null
  name: string
  trigger_type: string
  trigger_config: Record<string, unknown>
  action_type: string
  action_config: Record<string, unknown>
  is_active: boolean
}

/**
 * 在問卷提交後呼叫，檢查該問卷 + 租戶的所有自動化規則
 */
export async function checkAutomationTriggers(surveyId: string, tenantId: string): Promise<void> {
  const rules = await query<AutomationRule>(
    `SELECT id, tenant_id, survey_id, name, trigger_type, trigger_config, action_type, action_config, is_active
     FROM automation_rules
     WHERE tenant_id = $1 AND is_active = true
       AND (survey_id = $2 OR survey_id IS NULL)`,
    [tenantId, surveyId]
  )

  for (const rule of rules) {
    try {
      const shouldTrigger = await evaluateTrigger(rule, surveyId, tenantId)
      if (!shouldTrigger) continue

      await executeAction(rule, surveyId, tenantId)
      await execute(
        `UPDATE automation_rules SET last_triggered_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [rule.id]
      )
    } catch (err) {
      console.error(`[automation] Rule ${rule.id} (${rule.name}) failed:`, err)
    }
  }
}

/**
 * 評估單一規則的觸發條件
 */
async function evaluateTrigger(
  rule: AutomationRule,
  surveyId: string,
  _tenantId: string
): Promise<boolean> {
  switch (rule.trigger_type) {
    case 'response_count': {
      const threshold = Number(rule.trigger_config.threshold)
      if (!threshold || isNaN(threshold)) return false

      const row = await queryOne<{ count: string }>(
        `SELECT COUNT(*)::TEXT AS count FROM responses WHERE survey_id = $1 AND status = 'completed'`,
        [surveyId]
      )
      const count = parseInt(row?.count ?? '0', 10)
      // 精確匹配，避免每次提交都重複觸發
      return count === threshold
    }

    case 'schedule':
      // 排程規則由 cron job 處理，這裡不觸發
      return false

    default:
      return false
  }
}

/**
 * 執行自動化動作
 */
async function executeAction(
  rule: AutomationRule,
  surveyId: string,
  tenantId: string
): Promise<void> {
  switch (rule.action_type) {
    case 'line_notify': {
      const message = (rule.action_config.message as string) || '自動通知：問卷已達到觸發條件'
      await pushLineMessage([{ type: 'text', text: message }])
      break
    }

    case 'ai_insight': {
      const aiKey = await getActiveAiKey(tenantId) ?? getPlatformKey()
      if (!aiKey) {
        console.warn(`[automation] ai_insight action skipped — no AI key for tenant ${tenantId}`)
        break
      }
      const summary = await buildInsightSummary(surveyId, tenantId)
      const { report } = await generateInsightReport(summary, aiKey)
      await pushLineMessage([{
        type: 'text',
        text: `📊 自動洞察報告\n\n${report.summary}\n\n重點發現：\n${report.highlights.map((h: { title: string }) => `• ${h.title}`).join('\n')}`
      }])
      break
    }

    default:
      console.log(`[automation] Unknown action type: ${rule.action_type} (rule: ${rule.id})`)
  }
}
