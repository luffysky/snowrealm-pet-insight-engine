import { NextResponse } from 'next/server'
import { pushText } from '@/lib/line'

/**
 * POST /api/admin/line/test
 * 發送測試訊息到管理員 LINE，確認串接成功
 */
export async function POST(): Promise<NextResponse> {
  try {
    await pushText('✅ LINE 串接測試成功！\n毛行天下問卷系統已連線。')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin/line/test] Failed:', error)
    return NextResponse.json({ error: '發送失敗' }, { status: 500 })
  }
}
