import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/mobile-redirect?token=xxx&callback=yukiboard://auth/callback
 *
 * 把 token 帶回 App。用三層 fallback 確保跳轉成功：
 * 1. Location header（302 redirect to custom scheme）
 * 2. meta http-equiv refresh
 * 3. JavaScript window.location.href
 * 4. 手動點擊連結
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get('token')
  const callback = req.nextUrl.searchParams.get('callback')

  if (!token || !callback) {
    return NextResponse.json({ error: 'Missing token or callback' }, { status: 400 })
  }

  const deepLink = `${callback}?token=${encodeURIComponent(token)}`
  const scheme = callback.split('://')[0] || 'yukiboard'
  const intentUri = `intent://${deepLink.replace(/^[a-z]+:\/\//, '')}#Intent;scheme=${scheme};end`

  // 回傳 HTML 頁面，多重 fallback 確保跳轉
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>登入成功</title>
  <style>
    body { background: #0A0E1A; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #1a2040; border-radius: 16px; padding: 32px; text-align: center; max-width: 320px; }
    h2 { color: #40E0D0; margin: 0 0 12px; }
    p { color: #aaa; font-size: 14px; margin: 8px 0; }
    a.btn { display: inline-block; background: #00B4D8; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: bold; margin-top: 16px; }
    a.btn:active { background: #0090B0; }
  </style>
</head>
<body>
  <div class="card">
    <h2>✅ 登入成功</h2>
    <p>正在返回 YukiBoard...</p>
    <p style="font-size:12px;color:#666">如果沒有自動跳轉，請點擊下方按鈕</p>
    <a class="btn" id="backBtn" href="${deepLink}">返回 YukiBoard</a>
  </div>
  <script>
    // 方法1: intent URI（Android Chrome 最可靠）
    window.location.href = "${intentUri}";
    // 方法2: 1秒後 fallback 直接 custom scheme
    setTimeout(function() { window.location.href = "${deepLink}"; }, 1000);
  </script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
