import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'

/** GET /api/blogs/unsubscribe?token=xxx — 透過退訂 token 取消訂閱 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  if (!token) {
    return NextResponse.json({ error: '缺少退訂 token' }, { status: 400 })
  }

  const subscriber = await queryOne<{ id: string; email: string }>(
    `SELECT id, email FROM blog_subscribers WHERE unsubscribe_token = $1`,
    [token]
  )

  if (!subscriber) {
    return NextResponse.json({ error: '無效的退訂連結' }, { status: 404 })
  }

  await execute(
    `DELETE FROM blog_subscribers WHERE unsubscribe_token = $1`,
    [token]
  )

  // 回傳一個簡單的 HTML 確認頁
  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><title>退訂成功</title></head>
<body style="font-family:sans-serif;text-align:center;padding:60px 20px;color:#333">
  <h1 style="font-size:2rem">✅ 退訂成功</h1>
  <p style="color:#666;margin-top:12px">${subscriber.email} 已成功從此部落格的訂閱名單中移除。</p>
  <a href="/" style="display:inline-block;margin-top:24px;color:#f59e0b;text-decoration:none">← 回到首頁</a>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
