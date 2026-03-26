import { NextResponse } from 'next/server'
import { pushText } from '@/lib/line'
import { requireRole } from '@/lib/tenant'

/**
 * POST /api/admin/line/test
 * 發送測試訊息到管理員 LINE，確認串接成功
 */
export async function POST(): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck

  try {
    await pushText('✅ LINE 串接測試成功！\n問卷系統已連線。')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin/line/test] Failed:', error)
    return NextResponse.json({ error: '發送失敗' }, { status: 500 })
  }
}
