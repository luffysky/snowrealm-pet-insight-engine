import { query, queryOne, execute } from './db'
import { getActiveAiKey, logAiUsage } from './aiService'
import { gapPrompt } from './gapPrompts'

// ── Types ──────────────────────────────────────────────────────────────────

export interface GapSnapshot {
  traitKey: string
  selfScore: number
  othersAvgScore: number
  gapScore: number
  weightedGapScore: number
  responseCount: number
  gapLevel: 'aligned' | 'slight' | 'notable' | 'strong'
  confidenceLevel: number
}

export interface GapReport {
  userId: string
  surveyId: string
  totalGapScore: number
  gapLevel: 'aligned' | 'slight' | 'notable' | 'strong'
  snapshots: GapSnapshot[]
  aiStory: string
  styleKey: string
  isPartial: boolean
  generatedAt: string
}

interface SelfAnswerRow extends Record<string, unknown> {
  trait_key: string
  score: number
}

interface ExtAnswerRow extends Record<string, unknown> {
  trait_key: string
  avg_score: string
  count: string
}

interface SnapshotRow extends Record<string, unknown> {
  trait_key: string
  self_score: number
  others_avg_score: string
  gap_score: string
  weighted_gap_score: string
  response_count: number
  gap_level: string
  confidence_level: string
}

interface ReportRow extends Record<string, unknown> {
  id: string
  report_json: GapReport
  style_key: string
  is_partial: boolean
  generated_at: string
  zcoin_spent: number
}

// ── Gap Calculation ────────────────────────────────────────────────────────

function classifyGapLevel(gap: number): GapSnapshot['gapLevel'] {
  const abs = Math.abs(gap)
  if (abs <= 10) return 'aligned'
  if (abs <= 25) return 'slight'
  if (abs <= 45) return 'notable'
  return 'strong'
}

function calculateConfidence(responseCount: number): number {
  return Math.min(1, Math.log(responseCount + 1) / 3)
}

/** 計算單一特質的落差分數 */
export function calculateGap(selfScore: number, othersAvg: number): {
  gapScore: number
  gapLevel: GapSnapshot['gapLevel']
} {
  const gapScore = selfScore - othersAvg
  return { gapScore, gapLevel: classifyGapLevel(gapScore) }
}

/** 為用戶生成/更新認知落差快照 */
export async function generateGapSnapshot(userId: string, surveyId: string): Promise<GapSnapshot[]> {
  // 取自評答案
  const selfAnswers = await query<SelfAnswerRow>(
    `SELECT trait_key, score FROM self_trait_answers WHERE user_id = $1 AND survey_id = $2`,
    [userId, surveyId]
  )
  if (selfAnswers.length === 0) return []

  // 取他評平均（排除自己）
  const extAnswers = await query<ExtAnswerRow>(
    `SELECT trait_key, AVG(score)::TEXT AS avg_score, COUNT(*)::TEXT AS count
     FROM external_trait_answers
     WHERE target_user_id = $1 AND survey_id = $2
     GROUP BY trait_key`,
    [userId, surveyId]
  )

  const extMap = new Map(extAnswers.map(r => [r.trait_key, { avg: parseFloat(r.avg_score), count: parseInt(r.count, 10) }]))

  const snapshots: GapSnapshot[] = []

  for (const self of selfAnswers) {
    const ext = extMap.get(self.trait_key)
    const othersAvg = ext?.avg ?? self.score
    const responseCount = ext?.count ?? 0
    const confidence = calculateConfidence(responseCount)
    const { gapScore } = calculateGap(self.score, othersAvg)
    const weightedGap = gapScore * confidence

    const snap: GapSnapshot = {
      traitKey: self.trait_key,
      selfScore: self.score,
      othersAvgScore: Math.round(othersAvg * 100) / 100,
      gapScore: Math.round(gapScore * 100) / 100,
      weightedGapScore: Math.round(weightedGap * 100) / 100,
      responseCount,
      gapLevel: classifyGapLevel(gapScore),
      confidenceLevel: Math.round(confidence * 100) / 100,
    }
    snapshots.push(snap)

    // 寫入/更新 DB
    await execute(
      `INSERT INTO cognitive_gap_snapshots
         (user_id, survey_id, trait_key, self_score, others_avg_score, gap_score, weighted_gap_score, response_count, gap_level, confidence_level, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (user_id, survey_id, trait_key)
       DO UPDATE SET
         self_score = $4, others_avg_score = $5, gap_score = $6, weighted_gap_score = $7,
         response_count = $8, gap_level = $9, confidence_level = $10, updated_at = NOW()`,
      [userId, surveyId, snap.traitKey, snap.selfScore, snap.othersAvgScore, snap.gapScore, snap.weightedGapScore, snap.responseCount, snap.gapLevel, snap.confidenceLevel]
    )
  }

  return snapshots
}

/** 取得現有快照（不重算） */
export async function getGapSnapshots(userId: string, surveyId: string): Promise<GapSnapshot[]> {
  const rows = await query<SnapshotRow>(
    `SELECT trait_key, self_score, others_avg_score, gap_score, weighted_gap_score, response_count, gap_level, confidence_level
     FROM cognitive_gap_snapshots WHERE user_id = $1 AND survey_id = $2`,
    [userId, surveyId]
  )
  return rows.map(r => ({
    traitKey: r.trait_key,
    selfScore: r.self_score,
    othersAvgScore: parseFloat(r.others_avg_score),
    gapScore: parseFloat(r.gap_score),
    weightedGapScore: parseFloat(r.weighted_gap_score),
    responseCount: r.response_count,
    gapLevel: r.gap_level as GapSnapshot['gapLevel'],
    confidenceLevel: parseFloat(r.confidence_level),
  }))
}

/** 整體落差等級（取所有特質的最大 weighted gap 絕對值） */
export function getOverallGapLevel(snapshots: GapSnapshot[]): GapSnapshot['gapLevel'] {
  if (snapshots.length === 0) return 'aligned'
  const maxAbs = Math.max(...snapshots.map(s => Math.abs(s.weightedGapScore)))
  return classifyGapLevel(maxAbs)
}

// ── Gap Report (AI Story) ──────────────────────────────────────────────────

/** 生成 AI 故事報告（styleKey: A-E） */
export async function generateGapReport(params: {
  userId: string
  surveyId: string
  snapshots: GapSnapshot[]
  styleKey: 'A' | 'B' | 'C' | 'D' | 'E'
  tenantId: string
  isPartial?: boolean
}): Promise<GapReport | null> {
  const { userId, surveyId, snapshots, styleKey, tenantId, isPartial = true } = params

  const aiKey = await getActiveAiKey(tenantId)
  if (!aiKey) return null

  const prompt = gapPrompt(styleKey, snapshots)

  let aiStory = ''
  let promptTokens = 0
  let completionTokens = 0

  try {
    if (aiKey.provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': aiKey.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: aiKey.model,
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json() as { content: Array<{ text: string }>; usage?: { input_tokens: number; output_tokens: number } }
      aiStory = data.content?.[0]?.text ?? ''
      promptTokens = data.usage?.input_tokens ?? 0
      completionTokens = data.usage?.output_tokens ?? 0
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aiKey.apiKey}` },
        body: JSON.stringify({
          model: aiKey.model,
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json() as { choices: Array<{ message: { content: string } }>; usage?: { prompt_tokens: number; completion_tokens: number } }
      aiStory = data.choices?.[0]?.message?.content ?? ''
      promptTokens = data.usage?.prompt_tokens ?? 0
      completionTokens = data.usage?.completion_tokens ?? 0
    }
  } catch {
    return null
  }

  await logAiUsage({
    tenantId,
    action: 'insight',
    keySource: aiKey.keySource,
    provider: aiKey.provider,
    model: aiKey.model,
    promptTokens,
    completionTokens,
    isFree: false,
  })

  const totalGap = snapshots.reduce((sum, s) => sum + Math.abs(s.weightedGapScore), 0) / Math.max(snapshots.length, 1)
  const report: GapReport = {
    userId,
    surveyId,
    totalGapScore: Math.round(totalGap * 100) / 100,
    gapLevel: getOverallGapLevel(snapshots),
    snapshots,
    aiStory: aiStory.trim(),
    styleKey,
    isPartial,
    generatedAt: new Date().toISOString(),
  }

  // 存入 DB
  await execute(
    `INSERT INTO cognitive_gap_reports (user_id, survey_id, report_json, style_key, is_partial, zcoin_spent)
     VALUES ($1, $2, $3, $4, $5, 0)`,
    [userId, surveyId, JSON.stringify(report), styleKey, isPartial]
  )

  return report
}

/** 取最新報告（免費：最新partial；付費：指定 style） */
export async function getLatestGapReport(userId: string, surveyId: string, styleKey?: string): Promise<GapReport | null> {
  const row = await queryOne<ReportRow>(
    `SELECT id, report_json, style_key, is_partial, generated_at, zcoin_spent
     FROM cognitive_gap_reports
     WHERE user_id = $1 AND survey_id = $2
     ${styleKey ? `AND style_key = $3` : ''}
     ORDER BY generated_at DESC LIMIT 1`,
    styleKey ? [userId, surveyId, styleKey] : [userId, surveyId]
  )
  return row ? (row.report_json as GapReport) : null
}
