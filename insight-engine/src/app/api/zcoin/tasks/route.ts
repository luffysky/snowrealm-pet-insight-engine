import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { getDailyTasks, completeTask } from '@/lib/dailyTaskEngine'

async function getAuthContext() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return { userId: payload.sub as string, tenantId: (payload.tid as string) || 'default' }
}

/** GET /api/zcoin/tasks — 取得當日任務列表 */
export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  try {
    const tasks = await getDailyTasks(ctx.userId)
    return NextResponse.json({ tasks })
  } catch (err) {
    console.error('[GET /api/zcoin/tasks] Error:', err)
    return NextResponse.json({ error: '載入任務失敗' }, { status: 500 })
  }
}

/** POST /api/zcoin/tasks — 完成任務 */
export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  let body: { taskId: string }
  try {
    body = await req.json() as { taskId: string }
  } catch {
    return NextResponse.json({ error: '無效的請求格式' }, { status: 400 })
  }

  if (!body.taskId || typeof body.taskId !== 'string') {
    return NextResponse.json({ error: '請提供 taskId' }, { status: 400 })
  }

  try {
    const result = await completeTask(ctx.userId, body.taskId, ctx.tenantId)
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error('[POST /api/zcoin/tasks] Error:', err)
    return NextResponse.json({ error: '完成任務失敗，請稍後再試' }, { status: 500 })
  }
}
