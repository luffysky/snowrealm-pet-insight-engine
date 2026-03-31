import { query } from './db'
import { pushLineMessage, pushToUser } from './line'
import { getStyle, buildFlexBubble } from './lineStyles'

interface NotificationRule {
  id: string
  survey_id: string | null
  name: string
  condition_type: 'tag_match' | 'completion'
  condition_config: {
    tag_key?: string
    tag_value?: string
    operator?: 'eq' | 'contains' | 'any'
  }
  action_type: 'line_push_admin' | 'line_push_user'
  message_template: string
  [key: string]: unknown
}

interface TriggerContext {
  responseId: string
  surveySlug: string
  surveyId?: string
  tenantId?: string
  tags: { key: string; value: string }[]
  lineUserId?: string
}

/**
 * 條件觸發通知引擎
 * 在問卷送出後呼叫，根據 notification_rules 比對條件並發送通知
 */
export async function evaluateNotificationRules(ctx: TriggerContext): Promise<void> {
  try {
    const rules = ctx.tenantId
      ? await query<NotificationRule>(
          `SELECT * FROM notification_rules WHERE is_active = true AND tenant_id = $1`,
          [ctx.tenantId]
        )
      : await query<NotificationRule>(
          `SELECT * FROM notification_rules WHERE is_active = true`
        )

    for (const rule of rules) {
      // 如果規則綁定特定 survey，跳過不符合的
      if (rule.survey_id && rule.survey_id !== ctx.surveyId) continue

      const matched = checkCondition(rule, ctx)
      if (!matched) continue

      const message = renderTemplate(rule.message_template, ctx)
      await dispatchNotification(rule, message, ctx)
    }
  } catch (err) {
    console.error('[notificationEngine] Error evaluating rules:', err)
  }
}

function checkCondition(rule: NotificationRule, ctx: TriggerContext): boolean {
  switch (rule.condition_type) {
    case 'completion':
      // line_push_admin + completion 已由 notifySurveySubmitted 統一處理，避免重複推播
      if (rule.action_type === 'line_push_admin') return false
      return true

    case 'tag_match': {
      const { tag_key, tag_value, operator = 'eq' } = rule.condition_config
      if (!tag_key || !tag_value) return false

      return ctx.tags.some((t) => {
        if (t.key !== tag_key) return false
        switch (operator) {
          case 'eq':
            return t.value === tag_value
          case 'contains':
            return t.value.includes(tag_value)
          case 'any':
            return tag_value.split(',').some((v) => t.value === v.trim())
          default:
            return t.value === tag_value
        }
      })
    }

    default:
      return false
  }
}

function renderTemplate(template: string, ctx: TriggerContext): string {
  return template
    .replace(/\{\{response_id\}\}/g, ctx.responseId.slice(0, 8))
    .replace(/\{\{survey_slug\}\}/g, ctx.surveySlug)
    .replace(/\{\{tag_value\}\}/g, ctx.tags.map((t) => `${t.key}=${t.value}`).join(', '))
}

async function dispatchNotification(
  rule: NotificationRule,
  message: string,
  ctx: TriggerContext
): Promise<void> {
  switch (rule.action_type) {
    case 'line_push_admin': {
      const style = await getStyle('rule_admin')
      if (style) {
        const footerUrl = style.footer_url.replace('{{response_id}}', ctx.responseId)
        const msg = buildFlexBubble({
          style,
          headerOverride: `${style.header_emoji} ${rule.name}`,
          bodyRows: [
            { label: '規則', value: rule.name },
            { label: '問卷', value: ctx.surveySlug },
            { label: '內容', value: message },
          ],
          footerUrl,
          altText: `${style.header_emoji} ${rule.name}`,
        })
        await pushLineMessage([msg])
      } else {
        await pushLineMessage([{ type: 'text', text: message }])
      }
      await logNotification(rule.id, 'rule', 'admin', 'all_admins', ctx.responseId, 'sent')
      break
    }

    case 'line_push_user': {
      if (!ctx.lineUserId) return

      const style = await getStyle('rule_user')
      let messages: { type: string; [key: string]: unknown }[]
      if (style) {
        const msg = buildFlexBubble({
          style,
          bodyRows: [{ label: '訊息', value: message }],
          altText: `${style.header_emoji} ${style.header_text}`,
        })
        messages = [msg]
      } else {
        messages = [{ type: 'text', text: message }]
      }

      const result = await pushToUser(ctx.lineUserId, messages)
      await logNotification(
        rule.id,
        'rule',
        'user',
        ctx.lineUserId,
        ctx.responseId,
        result.ok ? 'sent' : 'failed',
        result.error
      )
      break
    }
  }
}

async function logNotification(
  ruleId: string | null,
  triggerType: 'rule' | 'weekly_report' | 'manual',
  recipientType: 'admin' | 'user',
  recipientId: string,
  responseId: string | null,
  status: 'sent' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO notification_logs (rule_id, trigger_type, recipient_type, recipient_id, response_id, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [ruleId, triggerType, recipientType, recipientId, responseId, status, errorMessage ?? null]
    )
  } catch (err) {
    console.error('[notificationEngine] Failed to log notification:', err)
  }
}
