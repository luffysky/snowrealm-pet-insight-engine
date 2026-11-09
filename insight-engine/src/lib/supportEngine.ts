/**
 * 客服系統引擎
 * 處理 LINE 訊息轉客服工單、管理員回覆推播
 */

import { after } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { getLineConfig } from '@/lib/lineConfig'
import { pushLineMessage } from '@/lib/line'

export interface LineTextMessage {
  type: 'text'
  text: string
}

// ===== DB 型別 =====

interface TicketRow extends Record<string, unknown> {
  id: string
  tenant_id: string
  line_user_id: string | null
  line_display_name: string | null
  first_response_at: string | null
}

// ===== 內部工具 =====

async function fetchLineDisplayName(lineUserId: string, officialToken: string): Promise<string> {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
      headers: { Authorization: `Bearer ${officialToken}` },
    })
    if (!res.ok) return lineUserId
    const data = await res.json() as { displayName?: string }
    return data.displayName ?? lineUserId
  } catch {
    return lineUserId
  }
}

async function pushToLineUser(lineUserId: string, messages: LineTextMessage[]): Promise<void> {
  const token = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN')
  if (!token) {
    console.warn('[supportEngine] Missing OFFICIAL_CHANNEL_ACCESS_TOKEN')
    return
  }
  try {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: lineUserId, messages }),
    })
  } catch (err) {
    console.error('[supportEngine] pushToLineUser failed:', err)
  }
}

// ===== 公開 API =====

/** 查詢用戶是否有進行中的客服工單 */
export async function getOpenTicketByLineUser(
  lineUserId: string,
  tenantId = 'default',
): Promise<TicketRow | null> {
  return queryOne<TicketRow>(
    `SELECT id, tenant_id, line_user_id, line_display_name, first_response_at
     FROM support_tickets
     WHERE line_user_id = $1 AND tenant_id = $2 AND status IN ('open', 'in_progress')
     ORDER BY created_at DESC LIMIT 1`,
    [lineUserId, tenantId],
  )
}

/**
 * 顧客傳訊息觸發客服 → 建立新工單
 * 同時通知管理員（Insight Bot channel）
 */
export async function startSupportTicket(
  lineUserId: string,
  firstMessage: string,
  tenantId = 'default',
): Promise<LineTextMessage[]> {
  const officialToken = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN') ?? ''
  const displayName = await fetchLineDisplayName(lineUserId, officialToken)
  const subject = firstMessage.slice(0, 50)

  const ticket = await queryOne<{ id: string }>(
    `INSERT INTO support_tickets
       (tenant_id, channel, line_user_id, line_display_name, subject, status)
     VALUES ($1, 'line', $2, $3, $4, 'open')
     RETURNING id`,
    [tenantId, lineUserId, displayName, subject],
  )

  if (!ticket) {
    console.error('[supportEngine] Failed to create support ticket')
    return [{ type: 'text', text: '系統忙碌中，請稍後再試 🙏' }]
  }

  await execute(
    `INSERT INTO support_messages (ticket_id, sender_type, sender_id, sender_name, content)
     VALUES ($1, 'customer', $2, $3, $4)`,
    [ticket.id, lineUserId, displayName, firstMessage],
  )

  // 非阻塞：通知管理員
  after(() => pushLineMessage([
    {
      type: 'text',
      text: `📬 新客服工單\n\n用戶：${displayName}\n訊息：${subject}\n\n請至後台查看並回覆`,
    },
  ]))

  return [
    {
      type: 'text',
      text: '📬 已收到你的訊息！\n\n我們的團隊會盡快回覆你。\n在等待期間可以繼續傳訊息補充說明 💬\n\n輸入「問卷」可回到問卷功能',
    },
  ]
}

/**
 * 顧客追加訊息到現有工單（靜默接收，不回覆避免打擾）
 */
export async function appendSupportMessage(
  ticketId: string,
  lineUserId: string,
  displayName: string,
  text: string,
): Promise<void> {
  await execute(
    `INSERT INTO support_messages (ticket_id, sender_type, sender_id, sender_name, content)
     VALUES ($1, 'customer', $2, $3, $4)`,
    [ticketId, lineUserId, displayName, text],
  )
  await execute(
    `UPDATE support_tickets SET updated_at = NOW() WHERE id = $1`,
    [ticketId],
  )
}

/**
 * 管理員回覆工單 → 儲存訊息 + LINE Push 給顧客
 * 由後台 API reply route 呼叫
 */
export async function sendAdminReplyToCustomer(
  ticketId: string,
  content: string,
): Promise<void> {
  const ticket = await queryOne<TicketRow>(
    `SELECT id, line_user_id, first_response_at FROM support_tickets WHERE id = $1`,
    [ticketId],
  )
  if (!ticket?.line_user_id) {
    console.warn('[supportEngine] Ticket has no LINE user ID, skip push:', ticketId)
    return
  }

  if (!ticket.first_response_at) {
    await execute(
      `UPDATE support_tickets SET first_response_at = NOW(), status = 'in_progress', updated_at = NOW() WHERE id = $1`,
      [ticketId],
    )
  }

  await pushToLineUser(ticket.line_user_id, [
    { type: 'text', text: `💬 客服回覆：\n\n${content}` },
  ])
}

/** 關閉工單並通知顧客 */
export async function resolveTicketAndNotify(ticketId: string): Promise<void> {
  const ticket = await queryOne<TicketRow>(
    `SELECT line_user_id FROM support_tickets WHERE id = $1`,
    [ticketId],
  )

  await execute(
    `UPDATE support_tickets SET status = 'resolved', resolved_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [ticketId],
  )

  if (ticket?.line_user_id) {
    await pushToLineUser(ticket.line_user_id, [
      { type: 'text', text: '✅ 您的問題已被標記為已解決。\n\n如有其他疑問，歡迎再次傳訊聯繫我們 🙏' },
    ])
  }
}
