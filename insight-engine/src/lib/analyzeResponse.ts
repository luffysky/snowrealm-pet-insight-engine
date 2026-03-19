import type { Answer } from '@/types'
import type { UserTag } from '@/types'

/**
 * 將問卷答案轉換為 CRM 標籤
 * MVP 採用規則式邏輯，不使用 AI / NLP
 */
export function analyzeResponse(answers: Answer[]): UserTag[] {
  const answerMap = buildAnswerMap(answers)
  const tags: UserTag[] = []

  addPetOwnerTags(answerMap, tags)
  addPetTypeTags(answerMap, tags)
  addRecordHabitTags(answerMap, tags)
  addRevisitFrequencyTags(answerMap, tags)
  addEmotionTags(answerMap, tags)
  addPlatformInterestTags(answerMap, tags)
  addPaymentIntentTags(answerMap, tags)
  addEngagementPotentialTags(answerMap, tags)
  addFeatureInterestTags(answerMap, tags)

  return tags
}

// ----- 工具函式 -----

type AnswerMap = Map<string, string | string[]>

function buildAnswerMap(answers: Answer[]): AnswerMap {
  const map = new Map<string, string | string[]>()
  for (const answer of answers) {
    map.set(answer.questionKey, answer.value)
  }
  return map
}

function getSingleValue(map: AnswerMap, key: string): string | undefined {
  const val = map.get(key)
  return typeof val === 'string' ? val : undefined
}

function getMultipleValues(map: AnswerMap, key: string): string[] {
  const val = map.get(key)
  return Array.isArray(val) ? val : []
}

// ----- 標籤生成規則 -----

function addPetOwnerTags(map: AnswerMap, tags: UserTag[]): void {
  const q1 = getSingleValue(map, 'q1')
  if (!q1) return

  const statusMap: Record<string, string> = {
    '有': 'current',
    '曾經有（已離世）': 'past',
    '沒有但未來想養': 'future',
    '沒有且暫時不考慮': 'none',
  }
  const status = statusMap[q1]
  if (status) {
    tags.push({ key: 'pet_owner_status', value: status })
  }

  if (q1 === '曾經有（已離世）') {
    tags.push({ key: 'loss_status', value: 'true' })
  } else {
    tags.push({ key: 'loss_status', value: 'false' })
  }
}

function addPetTypeTags(map: AnswerMap, tags: UserTag[]): void {
  const q2Values = getMultipleValues(map, 'q2')

  const typeMap: Record<string, string> = {
    '狗': 'dog',
    '貓': 'cat',
    '倉鼠 / 小動物': 'hamster',
    '鳥類': 'bird',
    '水族': 'fish',
    '爬蟲': 'reptile',
    '其他': 'other',
  }

  for (const val of q2Values) {
    const mapped = typeMap[val]
    if (mapped) {
      tags.push({ key: 'pet_type', value: mapped })
    }
  }
}

function addRecordHabitTags(map: AnswerMap, tags: UserTag[]): void {
  const q3Values = getMultipleValues(map, 'q3')
  if (q3Values.length === 0) return

  const hasActiveHabits =
    q3Values.includes('發 IG / FB / 社群') ||
    q3Values.includes('寫日記 / 筆記') ||
    q3Values.includes('存在雲端相簿')

  const isInactive = q3Values.includes('幾乎不記錄')

  if (isInactive && q3Values.length === 1) {
    tags.push({ key: 'record_habit', value: 'low' })
  } else if (hasActiveHabits) {
    tags.push({ key: 'record_habit', value: 'active' })
  } else {
    tags.push({ key: 'record_habit', value: 'medium' })
  }
}

function addRevisitFrequencyTags(map: AnswerMap, tags: UserTag[]): void {
  const q4 = getSingleValue(map, 'q4')
  if (!q4) return

  const frequencyMap: Record<string, string> = {
    '幾乎每天': 'daily',
    '一週幾次': 'weekly',
    '偶爾': 'occasional',
    '幾乎不會': 'rare',
  }
  const freq = frequencyMap[q4]
  if (freq) {
    tags.push({ key: 'revisit_frequency', value: freq })
  }
}

function addEmotionTags(map: AnswerMap, tags: UserTag[]): void {
  const q5 = getSingleValue(map, 'q5')
  if (!q5) return

  const emotionMap: Record<string, string> = {
    '非常擔心': 'high',
    '有點擔心': 'medium',
    '沒想過': 'low',
    '不太在意': 'low',
  }
  const level = emotionMap[q5]
  if (level) {
    tags.push({ key: 'emotion_level', value: level })
  }

  // Q6 → memorial_need
  const q6 = getSingleValue(map, 'q6')
  if (q6 === '回憶慢慢變模糊' || q6 === '沒有地方好好紀念') {
    tags.push({ key: 'memorial_need', value: 'high' })
  } else if (q6) {
    tags.push({ key: 'memorial_need', value: 'medium' })
  }
}

function addPlatformInterestTags(map: AnswerMap, tags: UserTag[]): void {
  const q7 = getSingleValue(map, 'q7')
  if (!q7) return

  if (q7 === '非常有興趣' || q7 === '可能會試試') {
    tags.push({ key: 'platform_interest', value: 'positive' })
  } else {
    tags.push({ key: 'platform_interest', value: 'neutral' })
  }
}

function addPaymentIntentTags(map: AnswerMap, tags: UserTag[]): void {
  const q8 = getSingleValue(map, 'q8')
  if (!q8) return

  const paymentMap: Record<string, string> = {
    '月費訂閱': 'subscription',
    '一次性付費': 'one_time',
    '免費基本版 + 進階付費': 'freemium',
    '不確定': 'unsure',
    '不會付費': 'no',
  }
  const intent = paymentMap[q8]
  if (intent) {
    tags.push({ key: 'payment_intent', value: intent })
  }
}

function addEngagementPotentialTags(map: AnswerMap, tags: UserTag[]): void {
  const q10 = getSingleValue(map, 'q10')
  if (!q10) return

  const engagementMap: Record<string, string> = {
    '每天': 'high',
    '每週': 'medium',
    '偶爾': 'low',
    '可能只用幾次': 'low',
    '幾乎不會用': 'low',
  }
  const potential = engagementMap[q10]
  if (potential) {
    tags.push({ key: 'engagement_potential', value: potential })
  }
}

function addFeatureInterestTags(map: AnswerMap, tags: UserTag[]): void {
  const q9Values = getMultipleValues(map, 'q9')

  const featureTagMap: Record<string, string> = {
    '寵物成長紀錄': 'interest_memory',
    '足跡時間線': 'interest_memory',
    'AI 寵物互動': 'interest_ai',
    '彩虹國紀念空間': 'interest_memory',
    '寵物社群交流': 'interest_social',
    '認養 / 流浪動物資訊': 'interest_adoption',
    '商城 / 周邊': 'interest_shop',
  }

  const addedKeys = new Set<string>()
  for (const val of q9Values) {
    const tagKey = featureTagMap[val]
    if (tagKey && !addedKeys.has(tagKey)) {
      tags.push({ key: tagKey, value: 'true' })
      addedKeys.add(tagKey)
    }
  }

  // 彩虹國 → memorial_need = high（若尚未加過）
  if (q9Values.includes('彩虹國紀念空間')) {
    const hasMemorialNeed = tags.some((t) => t.key === 'memorial_need')
    if (!hasMemorialNeed) {
      tags.push({ key: 'memorial_need', value: 'high' })
    }
  }
}
