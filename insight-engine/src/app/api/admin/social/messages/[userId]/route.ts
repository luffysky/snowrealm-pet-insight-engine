import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { query, execute, queryOne } from '@/lib/db'
import { decryptApiKey, encryptApiKey } from '@/lib/aiCrypto'

interface MessageRow extends Record<string, unknown> {
  id: string
  from_user_id: string
  to_user_id: string
  encrypted_content: string
  iv: string
  tag: string
  read_at: string | null
  recalled_at: string | null
  edited_at: string | null
  deleted_for: string[]
  created_at: string
  from_name: string | null
  from_avatar: string | null
  is_saved: boolean
}

interface MessageResult {
  id: string
  fromUserId: string
  toUserId: string
  content: string
  readAt: string | null
  recalledAt: string | null
  editedAt: string | null
  createdAt: string
  fromName: string | null
  fromAvatar: string | null
  isMine: boolean
  isSaved: boolean
}

function decryptMessage(row: MessageRow, myId: string): MessageResult {
  const isDeleted = Array.isArray(row.deleted_for) && row.deleted_for.includes(myId)
  let content = '[無法解密]'
  if (row.recalled_at) {
    content = '[已收回]'
  } else if (isDeleted) {
    content = '[已刪除]'
  } else {
    try {
      content = decryptApiKey({ encrypted: row.encrypted_content, iv: row.iv, tag: row.tag })
    } catch {
      // keep fallback
    }
  }
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    content,
    readAt: row.read_at,
    recalledAt: row.recalled_at,
    editedAt: row.edited_at,
    createdAt: row.created_at,
    fromName: row.from_name,
    fromAvatar: row.from_avatar,
    isMine: row.from_user_id === myId,
    isSaved: row.is_saved,
  }
}

/** GET — 取得對話訊息，?export=1 可匯出 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const myId = roleCheck.userId

  const { userId: otherId } = await params
  const isExport = req.nextUrl.searchParams.get('export') === '1'

  const rows = await query<MessageRow>(
    `SELECT dm.id, dm.from_user_id, dm.to_user_id,
            dm.encrypted_content, dm.iv, dm.tag,
            dm.read_at, dm.recalled_at, dm.edited_at,
            COALESCE(dm.deleted_for, '{}') AS deleted_for,
            dm.created_at,
            u.display_name AS from_name, u.avatar_url AS from_avatar,
            EXISTS(
              SELECT 1 FROM saved_messages sm
              WHERE sm.message_id = dm.id AND sm.user_id = $3
            ) AS is_saved
     FROM direct_messages dm
     JOIN admin_users u ON u.id = dm.from_user_id
     WHERE (dm.from_user_id = $1 AND dm.to_user_id = $2)
        OR (dm.from_user_id = $2 AND dm.to_user_id = $1)
     ORDER BY dm.created_at ASC
     LIMIT 200`,
    [myId, otherId, myId]
  )

  await execute(
    `UPDATE direct_messages SET read_at = NOW()
     WHERE from_user_id = $1 AND to_user_id = $2 AND read_at IS NULL`,
    [otherId, myId]
  )

  const messages = rows
    .filter(row => {
      const isDeleted = Array.isArray(row.deleted_for) && row.deleted_for.includes(myId)
      return !isDeleted
    })
    .map(row => decryptMessage(row, myId))

  if (isExport) {
    const lines = messages.map(m => {
      const time = new Date(m.createdAt).toLocaleString('zh-TW')
      const sender = m.isMine ? '我' : (m.fromName ?? '對方')
      return `[${time}] ${sender}: ${m.content}`
    })
    const text = lines.join('\n')
    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="messages-${otherId.slice(0, 8)}.txt"`,
      },
    })
  }

  return NextResponse.json({ messages })
}

/** PATCH — 收回訊息 or 保存訊息 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const myId = roleCheck.userId

  await params // consume

  const body = await req.json() as {
    action: 'recall' | 'save' | 'unsave' | 'edit'
    messageId: string
    newContent?: string
  }

  if (body.action === 'edit') {
    const content = body.newContent?.trim()
    if (!content) return NextResponse.json({ error: '內容不能為空' }, { status: 400 })
    const msg = await queryOne<{ from_user_id: string; recalled_at: string | null }>(
      `SELECT from_user_id, recalled_at FROM direct_messages WHERE id = $1`, [body.messageId]
    )
    if (!msg) return NextResponse.json({ error: '訊息不存在' }, { status: 404 })
    if (msg.from_user_id !== myId) return NextResponse.json({ error: '只能編輯自己的訊息' }, { status: 403 })
    if (msg.recalled_at) return NextResponse.json({ error: '已收回的訊息無法編輯' }, { status: 400 })

    const { encrypted, iv, tag } = encryptApiKey(content)
    await execute(
      `UPDATE direct_messages SET encrypted_content = $1, iv = $2, tag = $3, edited_at = NOW() WHERE id = $4`,
      [encrypted, iv, tag, body.messageId]
    )
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'recall') {
    // Only sender can recall
    const msg = await queryOne<{ from_user_id: string }>(
      `SELECT from_user_id FROM direct_messages WHERE id = $1`, [body.messageId]
    )
    if (!msg) return NextResponse.json({ error: '訊息不存在' }, { status: 404 })
    if (msg.from_user_id !== myId) return NextResponse.json({ error: '只能收回自己的訊息' }, { status: 403 })

    await execute(
      `UPDATE direct_messages SET recalled_at = NOW() WHERE id = $1`, [body.messageId]
    )
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'save') {
    await execute(
      `INSERT INTO saved_messages (user_id, message_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [myId, body.messageId]
    )
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'unsave') {
    await execute(
      `DELETE FROM saved_messages WHERE user_id = $1 AND message_id = $2`,
      [myId, body.messageId]
    )
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: '無效操作' }, { status: 400 })
}

/** DELETE — 刪除訊息（單筆 or 批量，僅對自己隱藏）*/
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const myId = roleCheck.userId

  await params // consume

  const body = await req.json() as { messageId?: string; messageIds?: string[] }
  const ids = body.messageIds ?? (body.messageId ? [body.messageId] : [])

  if (ids.length === 0) return NextResponse.json({ error: '缺少 messageId' }, { status: 400 })

  // Add myId to deleted_for array for each message
  for (const id of ids) {
    await execute(
      `UPDATE direct_messages
       SET deleted_for = array_append(COALESCE(deleted_for, '{}'), $1::text)
       WHERE id = $2 AND NOT ($1::text = ANY(COALESCE(deleted_for, '{}')))`,
      [myId, id]
    )
  }

  return NextResponse.json({ ok: true, count: ids.length })
}
