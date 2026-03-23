// ===== 後台 API 回傳型別定義 =====

import type { UserTag } from './tags'

/** Dashboard 統計摘要 */
export interface DashboardStats {
  totalResponses: number
  completedResponses: number
  completionRate: number
  todayResponses: number
  dailyTrend: DailyTrendItem[]
  topFeatures: FeatureCount[]
  emotionDistribution: TagDistribution[]
  avgCompletionTime: number
  responseVelocity: ResponseVelocityItem[]
  responseQuality: ResponseQuality
}

/** 回覆速度分佈 */
export interface ResponseVelocityItem {
  bucket: string  // '0-1h' | '1-6h' | '6-24h' | '24h+'
  count: number
}

/** 數據品質分析 */
export interface ResponseQuality {
  score: number           // 0–100
  totalCompleted: number
  issues: {
    shortAnswers: number       // 文字回覆過短（< 10 字元）
    emptyTextAnswers: number   // 開放題空白
    samePattern: number        // 選擇題全部相同選項
  }
}

/** 每日趨勢 */
export interface DailyTrendItem {
  date: string
  count: number
}

/** 功能偏好計數 */
export interface FeatureCount {
  feature: string
  count: number
}

/** 標籤分佈 */
export interface TagDistribution {
  tagKey: string
  tagValue: string
  count: number
}

/** 題目統計 */
export interface QuestionStats {
  questionKey: string
  questionContent: string
  questionType: string
  distribution: { label: string; count: number }[]
  textResponses?: string[]
}

/** 填答列表項 */
export interface ResponseListItem {
  id: string
  status: string
  source: string | null
  utmSource: string | null
  submittedAt: string | null
  createdAt: string
  notes: string | null
  tags: UserTag[]
  clickEvents: { eventType: string; clickedAt: string }[]
}

/** 填答詳情 */
export interface ResponseDetail extends ResponseListItem {
  answers: {
    questionKey: string
    questionContent: string
    value: string | string[]
  }[]
}

/** 分頁回傳 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

/** UTM 來源統計 */
export interface UtmSourceStats {
  source: string
  total: number
  completed: number
  completionRate: number
}

/** UTM 綜合分析 */
export interface UtmAnalytics {
  bySources: UtmSourceStats[]
  byMedium: UtmSourceStats[]
  byCampaign: UtmSourceStats[]
}
