import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { requireYukiBoardAuth } from '@/lib/yukiboard-auth'

/** POST /api/yukiboard/survey/answer — 提交問卷答案 */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireYukiBoardAuth(req)
    const body = await req.json()
    const { survey_id, option_index, emotion, app_package } = body
    const deviceHash = req.headers.get('X-Device-Hash') ?? ''

    if (!survey_id || option_index === undefined) {
      return NextResponse.json({ error: '缺少參數' }, { status: 400 })
    }

    // 檢查是否已回答過（24小時內同裝置）
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM yukiboard_survey_answers
       WHERE survey_id = $1 AND device_hash = $2
         AND created_at >= NOW() - INTERVAL '24 hours'`,
      [survey_id, deviceHash],
    )

    if (existing) {
      return NextResponse.json({ reward_zcoin: 0 })
    }

    // 儲存答案
    await execute(
      `INSERT INTO yukiboard_survey_answers (survey_id, user_id, device_hash, option_index, app_package, emotion)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [survey_id, userId, deviceHash, option_index, app_package ?? '', emotion ?? ''],
    )

    // 取得獎勵金額
    const survey = await queryOne<{ reward_zcoin: number }>(
      `SELECT reward_zcoin FROM yukiboard_surveys WHERE id = $1`,
      [survey_id],
    )
    const reward = survey?.reward_zcoin ?? 0

    // 若已登入且有獎勵，發放 Z 幣
    if (userId && reward > 0) {
      await execute(
        `UPDATE zcoin_wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2`,
        [reward, userId],
      )
      await execute(
        `INSERT INTO zcoin_transactions (user_id, amount, type, description)
         VALUES ($1, $2, 'reward', $3)`,
        [userId, reward, `問卷回答獎勵`],
      )
    }

    return NextResponse.json({ reward_zcoin: reward })
  } catch (error) {
    console.error('[Survey Answer]', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
