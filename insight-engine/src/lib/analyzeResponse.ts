import type { Answer } from '@/types'
import type { UserTag } from '@/types'

/**
 * 將問卷答案轉換為 CRM 標籤
 * MVP 採用規則式邏輯，不使用 AI / NLP
 * 支援 A/B/C 分流路線（依 Q1 決定）
 */
export function analyzeResponse(answers: Answer[]): UserTag[] {
  const answerMap = buildAnswerMap(answers)
  const tags: UserTag[] = []

  addPetOwnerTags(answerMap, tags)        // Q1（共用）
  addPetTypeTags(answerMap, tags)          // Q2（A 路線）
  addRecordHabitTags(answerMap, tags)      // Q3（A 路線）
  addRevisitFrequencyTags(answerMap, tags) // Q4（A 路線）
  addMemoryFadeTags(answerMap, tags)       // Q5（A 路線）
  addPreserveTags(answerMap, tags)         // Q6（A 路線）
  addPlatformInterestTags(answerMap, tags) // Q7（共用）
  addFeatureInterestTags(answerMap, tags)  // Q8（共用, multiple）
  addPaymentIntentTags(answerMap, tags)    // Q9（共用）
  addPlatformVisionTags(answerMap, tags)   // Q10（共用）
  addBRouteRecordTags(answerMap, tags)     // Q2B-Q5B（B 路線）
  addCRouteReasonTags(answerMap, tags)     // Q2C-Q5C（C 路線）

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

/** Q1：你現在有養寵物嗎？ */
function addPetOwnerTags(map: AnswerMap, tags: UserTag[]): void {
  const q1 = getSingleValue(map, 'q1')
  if (!q1) return

  const statusMap: Record<string, string> = {
    '有，現在正在養': 'current',
    '曾經養過': 'past',
    '沒有，但未來想養': 'future',
    '沒有，也暫時不考慮': 'none',
  }
  const status = statusMap[q1]
  if (status) {
    tags.push({ key: 'pet_owner_status', value: status })
  }

  if (q1 === '曾經養過') {
    tags.push({ key: 'loss_status', value: 'true' })
  } else {
    tags.push({ key: 'loss_status', value: 'false' })
  }
}

/** Q2（A 路線）：牠是什麼類型的孩子？ */
function addPetTypeTags(map: AnswerMap, tags: UserTag[]): void {
  const q2Values = getMultipleValues(map, 'q2')

  const typeMap: Record<string, string> = {
    '狗': 'dog',
    '貓': 'cat',
    '倉鼠 / 兔子/小動物': 'small_animal',
    '鳥類': 'bird',
    '水族/爬蟲/特殊寵物': 'exotic',
    '其他': 'other',
  }

  for (const val of q2Values) {
    const mapped = typeMap[val]
    if (mapped) {
      tags.push({ key: 'pet_type', value: mapped })
    }
  }
}

/** Q3（A 路線）：你平常會用什麼方式留下牠的紀錄？ */
function addRecordHabitTags(map: AnswerMap, tags: UserTag[]): void {
  const q3Values = getMultipleValues(map, 'q3')
  if (q3Values.length === 0) return

  const hasActiveHabits =
    q3Values.includes('IG／FB／社群發文') ||
    q3Values.includes('寫文字或日記')

  const isInactive = q3Values.includes('幾乎沒有特別紀錄')

  if (isInactive && q3Values.length === 1) {
    tags.push({ key: 'record_habit', value: 'low' })
  } else if (hasActiveHabits) {
    tags.push({ key: 'record_habit', value: 'active' })
  } else {
    tags.push({ key: 'record_habit', value: 'medium' })
  }
}

/** Q4（A 路線）：你多久會回頭看一次紀錄？ */
function addRevisitFrequencyTags(map: AnswerMap, tags: UserTag[]): void {
  const q4 = getSingleValue(map, 'q4')
  if (!q4) return

  const frequencyMap: Record<string, string> = {
    '幾乎每天': 'daily',
    '一週幾次': 'weekly',
    '偶爾才會': 'occasional',
    '幾乎不會': 'rare',
  }
  const freq = frequencyMap[q4]
  if (freq) {
    tags.push({ key: 'revisit_frequency', value: freq })
  }
}

/** Q5（A 路線）：記憶會不會變模糊？ */
function addMemoryFadeTags(map: AnswerMap, tags: UserTag[]): void {
  const q5 = getSingleValue(map, 'q5')
  if (!q5) return

  const emotionMap: Record<string, string> = {
    '常常會': 'high',
    '偶爾會': 'medium',
    '很少會': 'low',
    '幾乎沒想過': 'low',
  }
  const level = emotionMap[q5]
  if (level) {
    tags.push({ key: 'emotion_level', value: level })
  }
}

/** Q6（A 路線）：如果只能選一個，最想留下什麼？ */
function addPreserveTags(map: AnswerMap, tags: UserTag[]): void {
  const q6 = getSingleValue(map, 'q6')
  if (!q6) return

  const preserveMap: Record<string, string> = {
    '牠的照片與影片': 'media',
    '和牠發生過的故事': 'story',
    '牠的聲音／互動感': 'interaction',
    '牠的成長過程': 'growth',
    '一種「牠還存在過」的感覺': 'existence',
  }
  const val = preserveMap[q6]
  if (val) {
    tags.push({ key: 'preserve_priority', value: val })
  }

  if (q6 === '一種「牠還存在過」的感覺' || q6 === '和牠發生過的故事') {
    tags.push({ key: 'memorial_need', value: 'high' })
  }
}

/** Q7（共用）：如果有一個地方可以整理足跡，有興趣嗎？ */
function addPlatformInterestTags(map: AnswerMap, tags: UserTag[]): void {
  const q7 = getSingleValue(map, 'q7')
  if (!q7) return

  if (q7 === '很有興趣' || q7 === '可能會試試看') {
    tags.push({ key: 'platform_interest', value: 'positive' })
  } else {
    tags.push({ key: 'platform_interest', value: 'neutral' })
  }
}

/** Q8（共用, multiple max 3）：對哪些功能最有興趣？ */
function addFeatureInterestTags(map: AnswerMap, tags: UserTag[]): void {
  const q8Values = getMultipleValues(map, 'q8')

  const featureTagMap: Record<string, string> = {
    '寵物專屬檔案': 'interest_profile',
    '足跡時間線／回憶整理': 'interest_memory',
    'AI 陪伴／互動': 'interest_ai',
    '離世紀念空間': 'interest_memorial',
    '看別人的寵物故事': 'interest_social',
    '認養／流浪動物資訊': 'interest_adoption',
    '未來提醒／重要日子紀錄': 'interest_reminder',
  }

  const addedKeys = new Set<string>()
  for (const val of q8Values) {
    const tagKey = featureTagMap[val]
    if (tagKey && !addedKeys.has(tagKey)) {
      tags.push({ key: tagKey, value: 'true' })
      addedKeys.add(tagKey)
    }
  }

  if (q8Values.includes('離世紀念空間')) {
    const hasMemorialNeed = tags.some((t) => t.key === 'memorial_need')
    if (!hasMemorialNeed) {
      tags.push({ key: 'memorial_need', value: 'high' })
    }
  }
}

/** Q9（共用）：比較能接受哪種付費方式？ */
function addPaymentIntentTags(map: AnswerMap, tags: UserTag[]): void {
  const q9 = getSingleValue(map, 'q9')
  if (!q9) return

  const paymentMap: Record<string, string> = {
    '免費使用就好': 'free_only',
    '部分免費，進階功能付費': 'freemium',
    '一次性付費': 'one_time',
    '小額訂閱': 'subscription',
    '目前還不確定': 'unsure',
  }
  const intent = paymentMap[q9]
  if (intent) {
    tags.push({ key: 'payment_intent', value: intent })
  }
}

/** Q10（共用）：希望毛行天下成為哪種地方？ */
function addPlatformVisionTags(map: AnswerMap, tags: UserTag[]): void {
  const q10 = getSingleValue(map, 'q10')
  if (!q10) return

  const visionMap: Record<string, string> = {
    '幫我整理寵物足跡的地方': 'record_tool',
    '可以紀念牠的地方': 'memorial_space',
    '可以認識別人家寵物的地方': 'social_platform',
    '可以陪伴我與牠日常的地方': 'companion_product',
    '還不確定，但願意看看': 'exploring',
  }
  const vision = visionMap[q10]
  if (vision) {
    tags.push({ key: 'platform_vision', value: vision })
  }
}

/** B 路線標籤（Q2B-Q5B） */
function addBRouteRecordTags(map: AnswerMap, tags: UserTag[]): void {
  const q2b = getMultipleValues(map, 'q2b')
  if (q2b.length > 0) {
    const hasActive = q2b.includes('發社群') || q2b.includes('寫文字或日記')
    const isPassive = q2b.includes('可能不太會特別記錄') || q2b.includes('還沒想過')
    if (isPassive && q2b.length <= 2) {
      tags.push({ key: 'future_record_intent', value: 'low' })
    } else if (hasActive) {
      tags.push({ key: 'future_record_intent', value: 'active' })
    } else {
      tags.push({ key: 'future_record_intent', value: 'medium' })
    }
  }

  const q3b = getSingleValue(map, 'q3b')
  if (q3b === '會' || q3b === '有一點') {
    tags.push({ key: 'memory_awareness', value: 'high' })
  } else if (q3b) {
    tags.push({ key: 'memory_awareness', value: 'low' })
  }

  const q4b = getSingleValue(map, 'q4b')
  if (q4b === '很在意' || q4b === '還不錯') {
    tags.push({ key: 'growth_record_care', value: 'positive' })
  } else if (q4b) {
    tags.push({ key: 'growth_record_care', value: 'neutral' })
  }

  const q5b = getSingleValue(map, 'q5b')
  if (q5b === '很有興趣' || q5b === '可能會試試看') {
    tags.push({ key: 'footprint_interest_b', value: 'positive' })
  } else if (q5b) {
    tags.push({ key: 'footprint_interest_b', value: 'neutral' })
  }
}

/** C 路線標籤（Q2C-Q5C） */
function addCRouteReasonTags(map: AnswerMap, tags: UserTag[]): void {
  const q2c = getMultipleValues(map, 'q2c')
  for (const val of q2c) {
    const reasonMap: Record<string, string> = {
      '時間不夠': 'time',
      '經濟因素': 'finance',
      '居住環境不適合': 'environment',
      '沒有特別興趣': 'no_interest',
      '曾經有不好的經驗': 'bad_experience',
      '其他': 'other',
    }
    const reason = reasonMap[val]
    if (reason) {
      tags.push({ key: 'no_pet_reason', value: reason })
    }
  }

  const q3c = getSingleValue(map, 'q3c')
  if (q3c === '有，而且很親近') {
    tags.push({ key: 'pet_proximity', value: 'close' })
  } else if (q3c === '有，但沒有特別接觸') {
    tags.push({ key: 'pet_proximity', value: 'distant' })
  } else if (q3c) {
    tags.push({ key: 'pet_proximity', value: 'none' })
  }

  const q4c = getSingleValue(map, 'q4c')
  if (q4c === '很認同' || q4c === '還算認同') {
    tags.push({ key: 'pet_importance_agree', value: 'positive' })
  } else if (q4c) {
    tags.push({ key: 'pet_importance_agree', value: 'neutral' })
  }

  const q5c = getSingleValue(map, 'q5c')
  if (q5c === '很有意義' || q5c === '還不錯') {
    tags.push({ key: 'story_meaning_c', value: 'positive' })
  } else if (q5c) {
    tags.push({ key: 'story_meaning_c', value: 'neutral' })
  }
}
