/**
 * 老闆指令數據查詢（可複用於 Web API + LINE Bot）
 */
import { query, queryOne } from '@/lib/db'

/** 根據指令名稱查詢平台數據，回傳文字結果 */
export async function getOwnerData(cmd: string): Promise<string | null> {
  try {
    if (cmd === 'platform') {
      const [tenants, users, surveys, responses, todayNew, todayResponses] = await Promise.all([
        queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM tenants WHERE is_active = true`),
        queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM admin_users`),
        queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM surveys`),
        queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM responses WHERE status = 'completed'`),
        queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM admin_users WHERE created_at >= CURRENT_DATE`),
        queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM responses WHERE created_at >= CURRENT_DATE AND status = 'completed'`),
      ])
      return `📊 全平台總覽\n\n` +
        `🏢 租戶組織：${tenants?.cnt ?? 0} 個\n` +
        `👥 總用戶數：${users?.cnt ?? 0} 人\n` +
        `📋 問卷數：${surveys?.cnt ?? 0} 份\n` +
        `📝 完成填答：${responses?.cnt ?? 0} 筆\n` +
        `\n📅 今日\n` +
        `• 新註冊：${todayNew?.cnt ?? 0} 人\n` +
        `• 新填答：${todayResponses?.cnt ?? 0} 筆`
    }

    if (cmd === 'today') {
      const [dau, newUsers, newResponses, aiCalls, posts, comments] = await Promise.all([
        queryOne<{ cnt: string }>(`SELECT COUNT(DISTINCT user_id)::text AS cnt FROM responses WHERE created_at >= CURRENT_DATE`),
        queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM admin_users WHERE created_at >= CURRENT_DATE`),
        queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM responses WHERE created_at >= CURRENT_DATE AND status = 'completed'`),
        queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM ai_usage_logs WHERE created_at >= CURRENT_DATE`).catch(() => ({ cnt: '0' })),
        queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM social_posts WHERE created_at >= CURRENT_DATE`).catch(() => ({ cnt: '0' })),
        queryOne<{ cnt: string }>(`SELECT COUNT(*)::text AS cnt FROM social_comments WHERE created_at >= CURRENT_DATE`).catch(() => ({ cnt: '0' })),
      ])
      return `📋 今日報告\n\n` +
        `👥 活躍用戶：${dau?.cnt ?? 0} 人\n` +
        `🆕 新註冊：${newUsers?.cnt ?? 0} 人\n` +
        `📝 填答：${newResponses?.cnt ?? 0} 筆\n` +
        `🤖 AI 呼叫：${aiCalls?.cnt ?? 0} 次\n` +
        `📰 新貼文：${posts?.cnt ?? 0} 篇\n` +
        `💬 新留言：${comments?.cnt ?? 0} 則`
    }

    if (cmd === 'ai-cost') {
      const [monthTotal, todayTotal, byModel] = await Promise.all([
        queryOne<{ total: string; calls: string }>(
          `SELECT COALESCE(SUM(cost_usd), 0)::text AS total, COUNT(*)::text AS calls
           FROM ai_cost_log WHERE created_at >= date_trunc('month', CURRENT_DATE)`
        ).catch(() => ({ total: '0', calls: '0' })),
        queryOne<{ total: string; calls: string }>(
          `SELECT COALESCE(SUM(cost_usd), 0)::text AS total, COUNT(*)::text AS calls
           FROM ai_cost_log WHERE created_at >= CURRENT_DATE`
        ).catch(() => ({ total: '0', calls: '0' })),
        query<{ model: string; total: string; calls: string }>(
          `SELECT model, COALESCE(SUM(cost_usd), 0)::text AS total, COUNT(*)::text AS calls
           FROM ai_cost_log WHERE created_at >= date_trunc('month', CURRENT_DATE)
           GROUP BY model ORDER BY SUM(cost_usd) DESC LIMIT 5`
        ).catch(() => []),
      ])
      const modelLines = byModel.map(m => `  • ${m.model}: $${parseFloat(m.total).toFixed(4)} (${m.calls} 次)`).join('\n')
      return `🤖 AI 成本\n\n` +
        `📅 今日：$${parseFloat(todayTotal?.total ?? '0').toFixed(4)} / ${todayTotal?.calls ?? 0} 次\n` +
        `📆 本月：$${parseFloat(monthTotal?.total ?? '0').toFixed(4)} / ${monthTotal?.calls ?? 0} 次\n` +
        (modelLines ? `\n📊 模型明細：\n${modelLines}` : '')
    }

    if (cmd === 'revenue') {
      const [todayRev, monthRev, zcoinTotal] = await Promise.all([
        queryOne<{ total: string; cnt: string }>(
          `SELECT COALESCE(SUM(amount), 0)::text AS total, COUNT(*)::text AS cnt
           FROM payment_orders WHERE status = 'paid' AND created_at >= CURRENT_DATE`
        ).catch(() => ({ total: '0', cnt: '0' })),
        queryOne<{ total: string; cnt: string }>(
          `SELECT COALESCE(SUM(amount), 0)::text AS total, COUNT(*)::text AS cnt
           FROM payment_orders WHERE status = 'paid' AND created_at >= date_trunc('month', CURRENT_DATE)`
        ).catch(() => ({ total: '0', cnt: '0' })),
        queryOne<{ total: string }>(
          `SELECT COALESCE(SUM(balance), 0)::text AS total FROM zcoin_wallets`
        ).catch(() => ({ total: '0' })),
      ])
      return `💰 財報\n\n` +
        `📅 今日營收：$${parseInt(todayRev?.total ?? '0').toLocaleString()} (${todayRev?.cnt ?? 0} 筆訂單)\n` +
        `📆 本月營收：$${parseInt(monthRev?.total ?? '0').toLocaleString()} (${monthRev?.cnt ?? 0} 筆訂單)\n` +
        `🪙 Z幣流通量：${parseInt(zcoinTotal?.total ?? '0').toLocaleString()} Z`
    }

    if (cmd === 'surveys') {
      const rows = await query<{ title: string; cnt: string; tenant: string }>(
        `SELECT s.title, COUNT(r.id)::text AS cnt, COALESCE(t.name, s.tenant_id) AS tenant
         FROM surveys s
         LEFT JOIN responses r ON r.survey_id = s.id AND r.status = 'completed'
         LEFT JOIN tenants t ON t.slug = s.tenant_id
         GROUP BY s.id, s.title, t.name, s.tenant_id
         ORDER BY COUNT(r.id) DESC
         LIMIT 10`
      )
      const lines = rows.map((r, i) => `${i + 1}. ${r.title} — ${r.cnt} 筆 (${r.tenant})`).join('\n')
      return `📋 問卷總覽 (Top 10)\n\n${lines || '尚無問卷'}`
    }

    if (cmd === 'weekly') {
      const rows = await query<{ d: string; cnt: string }>(
        `SELECT date(created_at)::text AS d, COUNT(*)::text AS cnt
         FROM responses WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND status = 'completed'
         GROUP BY date(created_at) ORDER BY date(created_at) ASC`
      )
      const lines = rows.map(r => `${r.d}: ${r.cnt} 筆`).join('\n')
      const total = rows.reduce((s, r) => s + parseInt(r.cnt), 0)
      return `📈 本週趨勢（近 7 天共 ${total} 筆填答）\n\n${lines || '暫無數據'}`
    }

    return null
  } catch (err) {
    console.error('[ownerData]', err)
    return '查詢失敗，請稍後再試'
  }
}
