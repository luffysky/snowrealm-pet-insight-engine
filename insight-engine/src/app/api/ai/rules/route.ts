import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey, touchApiKey, listSurveyRules } from '@/lib/ruleEngine'

/**
 * GET /api/ai/rules?surveyId=<uuid>
 * Authorization: Bearer sie_xxxx
 *
 * 回傳指定問卷的所有標籤規則，供外部 Rule Engine 使用。
 * 需要 scope: rules:read
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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
  if (!keyResult.scopes.includes('rules:read')) {
    return NextResponse.json({ error: 'Insufficient scope' }, { status: 403 })
  }

  // 3. 驗證 query params
  const { searchParams } = new URL(request.url)
  const surveyId = searchParams.get('surveyId')

  if (!surveyId) {
    return NextResponse.json({ error: 'surveyId is required' }, { status: 400 })
  }

  // 4. 更新 last_used_at（非阻塞）
  touchApiKey(keyResult.keyHash)

  // 5. 取得規則
  const rules = await listSurveyRules(surveyId)

  return NextResponse.json({ rules, surveyId })
}
