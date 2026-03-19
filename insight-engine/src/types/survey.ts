// ===== 問卷系統型別定義 =====

/** 題目類型 */
export type QuestionType = 'single' | 'multiple' | 'text'

/** 問卷狀態 */
export type SurveyStatus = 'draft' | 'published' | 'archived'

/** 填答狀態 */
export type ResponseStatus = 'in_progress' | 'completed'

/** 單一選項 */
export interface QuestionOption {
  label: string
  value: string
}

/** 題目定義 */
export interface Question {
  key: string
  type: QuestionType
  content: string
  options: QuestionOption[]
  isRequired: boolean
  /** 多選題最大選擇數，不設則不限 */
  maxSelections?: number
}

/** 問卷設定 */
export interface SurveyConfig {
  slug: string
  title: string
  subtitle: string
  coverTitle: string
  coverSubtitle: string
  startButtonText: string
  doneTitle: string
  doneSubtitle: string
  questions: Question[]
}

/** 單筆答案 */
export interface Answer {
  questionKey: string
  value: string | string[]
}

/** 提交問卷的請求 body */
export interface SubmitSurveyPayload {
  surveySlug: string
  answers: Answer[]
  utm: UtmParams
  fingerprint?: string
  progressResponseId?: string
}

/** UTM 參數 */
export interface UtmParams {
  source?: string
  medium?: string
  campaign?: string
}
