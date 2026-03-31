import { NextResponse } from 'next/server'

/**
 * ⚠️ 廢棄路由
 * 此 route 使用與 /api/line/webhook 相同的 INSIGHT Channel Token，
 * 同一個 LINE Channel 只能設定一條 Webhook URL，此路由永遠收不到訊息。
 *
 * 請改用：
 *   /api/line/webhook          — Insight 後台回報 Bot
 *   /api/line/webhook/official — 毛行天下官方帳號
 *   /api/line/webhook/maoxing  — 毛行天下足跡站
 *   /api/line/webhook/insight  — Insight Engine 對外帳號
 */
export async function POST() {
  return NextResponse.json({ error: 'deprecated, use /api/line/webhook instead' }, { status: 410 })
}
