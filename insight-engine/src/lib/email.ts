/**
 * Email 發送服務
 * 優先使用 Resend API；未設定時 dev 環境 fallback 到 console
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'SnowRealm Insight <onboarding@resend.dev>'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  // Resend API
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('[Email] Resend error:', body)
        return { success: false, error: body?.message || 'Resend API failed' }
      }
      return { success: true }
    } catch (err) {
      console.error('[Email] Resend exception:', err)
      return { success: false, error: 'Email sending failed' }
    }
  }

  // Dev fallback — log to console
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n═══════════════════════════════════════')
    console.log(`📧 DEV EMAIL → ${to}`)
    console.log(`   Subject: ${subject}`)
    console.log(`   Body: ${html.replace(/<[^>]*>/g, '')}`)
    console.log('═══════════════════════════════════════\n')
    return { success: true }
  }

  return { success: false, error: '未設定 RESEND_API_KEY，無法寄送 Email' }
}

/** 產生驗證碼 Email HTML */
export function buildVerificationEmail(code: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f4f4f7;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0891b2,#06b6d4);padding:24px 32px;">
      <h2 style="margin:0;color:#fff;font-size:20px;">📊 SnowRealm Insight Engine</h2>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;">您好，以下是您的 Email 驗證碼：</p>
      <div style="font-size:36px;font-weight:bold;color:#0891b2;text-align:center;padding:20px;background:#f0fdfa;border-radius:8px;margin:16px 0;letter-spacing:8px;">
        ${code}
      </div>
      <p style="margin:16px 0 0;font-size:14px;color:#666;">此驗證碼將於 <strong>10 分鐘</strong>後過期，請儘速完成驗證。</p>
      <p style="margin:16px 0 0;font-size:13px;color:#999;">如果您沒有進行此操作，請忽略這封信。</p>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;text-align:center;font-size:12px;color:#aaa;">
      &copy; SnowRealm Insight Engine
    </div>
  </div>
</body>
</html>`
}
