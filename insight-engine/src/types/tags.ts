// ===== CRM 標籤型別定義 =====

/** 標籤鍵值對 */
export interface UserTag {
  key: string
  value: string
}

// ----- 基本類 -----
export type PetOwnerStatus = 'current' | 'past' | 'future' | 'none'
export type PetType = 'dog' | 'cat' | 'hamster' | 'bird' | 'fish' | 'reptile' | 'other'

// ----- 情感類 -----
export type EmotionLevel = 'high' | 'medium' | 'low'
export type MemorialNeed = 'high' | 'medium' | 'low'

// ----- 行為類 -----
export type RecordHabit = 'active' | 'medium' | 'low'
export type RevisitFrequency = 'daily' | 'weekly' | 'occasional' | 'rare'

// ----- 商業傾向類 -----
export type PaymentIntent = 'subscription' | 'one_time' | 'freemium' | 'unsure' | 'no'
export type EngagementPotential = 'high' | 'medium' | 'low'
