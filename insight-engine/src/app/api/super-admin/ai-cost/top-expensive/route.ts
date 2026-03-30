import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const tenants = payload.tenants || (payload.tid ? [{ role: payload.role || 'admin' }] : [])
  const isSuper = tenants.some((t: { role: string }) => t.role === 'super_admin') || payload.role === 'super_admin'
  if (!isSuper) return null
  return payload
}

interface ExpensiveRow {
  id: string
  user_id: string
  model: string
  intent_type: string | null
  prompt_tokens: number
  completion_tokens: number
  total_cost_usd: string
  created_at: string
  nickname: string | null
  display_name: string | null
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT acl.id, acl.user_id, acl.model, acl.intent_type,
              acl.prompt_tokens, acl.completion_tokens, acl.total_cost_usd, acl.created_at,
              up.nickname, up.display_name
       FROM ai_cost_log acl
       LEFT JOIN user_profiles up ON up.user_id = acl.user_id
       ORDER BY acl.total_cost_usd DESC
       LIMIT 10`
    )

    const data = rows.map(r => ({ ...r, total_cost_usd: parseFloat(String(r.total_cost_usd)) }))
    return NextResponse.json({ data })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') return NextResponse.json({ data: [] })
    console.error('[ai-cost/top-expensive GET]', err)
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 })
  }
}
