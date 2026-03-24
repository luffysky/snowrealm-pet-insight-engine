import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey, touchApiKey, validateSurveyJson } from '@/lib/ruleEngine'

/**
 * POST /api/ai/validate
 * Authorization: Bearer sie_xxxx
 * Body: { survey: { title, questions: [...] } }
 *
 * 驗證問卷 JSON 結構是否符合 Insight Engine 規格。
 * 需要 scope: validate
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. 驗證 API Key
  const authHeader = request.headers.get('authorization') ?? ''
  const rawKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!rawKey) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })
  }

  const keyResult = await verifyApiKey(rawKey)
  if (!keyResult) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })
  }

  // 2. 檢查 scope
  if (!keyResult.scopes.includes('validate')) {
    return NextResponse.json({ error: 'Insufficient scope' }, { status: 403 })
  }

  // 3. 更新 last_used_at（非阻塞）
  touchApiKey(keyResult.keyHash)

  // 4. 解析 body
  const body = await request.json().catch(() => null)
  const survey = body?.survey ?? null

  // 5. 驗證問卷結構
  const result = validateSurveyJson(survey)

  return NextResponse.json(result)
}
