import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { headers } from 'next/headers'
import { verifyToken } from '@/lib/jwt'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 連線到時會斷，瀏覽器 EventSource 會自動重連

export async function GET(request: NextRequest): Promise<Response> {
  // SSE cannot use middleware-injected headers reliably; fall back to cookie auth
  const token = request.cookies.get('admin_session')?.value
  if (!token) return new Response('未授權', { status: 401 })

  // Also accept header-based auth when available
  const h = await headers()
  const headerRole = h.get('x-user-role')
  let authorized = headerRole === 'super_admin'

  if (!authorized) {
    const payload = await verifyToken(token)
    authorized = payload?.role === 'super_admin'
  }
  if (!authorized) return new Response('權限不足', { status: 403 })

  const encoder = new TextEncoder()
  let lastCreatedAt: string | null = null
  let pollInterval: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('data: {"type":"ping"}\n\n'))

      pollInterval = setInterval(async () => {
        try {
          const rows = await query<{
            id: string; user_id: string; action: string; category: string
            details: string; ip_address: string; created_at: string
            nickname: string; display_name: string
          }>(
            `SELECT al.id, al.user_id, al.action, al.category, al.details,
                    al.ip_address, al.created_at, up.nickname, up.display_name
             FROM activity_log al
             LEFT JOIN user_profiles up ON up.user_id = al.user_id
             WHERE ($1::timestamptz IS NULL OR al.created_at > $1::timestamptz)
             ORDER BY al.created_at ASC
             LIMIT 20`,
            [lastCreatedAt]
          )

          if (rows.length > 0) {
            lastCreatedAt = rows[rows.length - 1].created_at
            for (const row of rows) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(row)}\n\n`))
            }
          } else {
            controller.enqueue(encoder.encode('data: {"type":"ping"}\n\n'))
          }
        } catch {
          if (pollInterval) clearInterval(pollInterval)
          controller.close()
        }
      }, 3000)

      request.signal.addEventListener('abort', () => {
        if (pollInterval) clearInterval(pollInterval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
