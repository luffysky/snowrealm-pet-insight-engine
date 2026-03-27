// ===== 問卷系統型別定義 =====

/** 題目類型 */
export type QuestionType = 'single' | 'multiple' | 'text' | 'rating' | 'scale' | 'date' | 'file_upload'

/** 問卷狀態 */
export type SurveyStatus = 'draft' | 'published' | 'archived'

/** 填答狀態 */
export type ResponseStatus = 'in_progress' | 'completed'

/** 單一選項 */
export interface QuestionOption {
  label: string
  value: string
  /** 手動指定的 emoji 圖示（後台設定） */
  emoji?: string
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
  /** 分流路線：'all' = 所有人, 'A' | 'B' | 'C' = 指定路線 */
  route?: string
  /** 章節名稱，例如 '序章'、'第一章 · 相遇' */
  chapter?: string
  /** 場景 emoji 插畫 */
  emoji?: string
  /** 場景敘事文字 */
  narrative?: string
  /** rating/scale 的最小值 */
  min?: number
  /** rating/scale 的最大值 */
  max?: number
  /** scale 的步進值 */
  step?: number
  /** file_upload 允許的 MIME types */
  acceptedFileTypes?: string[]
  /** file_upload 最大檔案大小 (MB) */
  maxFileSize?: number
  /** 是否允許「其他」選項附帶文字輸入（single/multiple 題型） */
  allowOtherText?: boolean
}

/** 單一分流規則 */
export interface BranchRule {
  /** 唯一識別碼（React key / 拖曳用） */
  id: string
  /** 分流依據的題目 key（例如 'q1'） */
  branchKey: string
  /** 各路線對應的選項值 */
  routes: Record<string, string[]>
}

/** 分流規則設定（支援多層）
 *  - 新版：BranchRule[]（多規則陣列）
 *  - 舊版相容：{ branchKey, routes }（單規則物件）
 *  讀取時透過 normalizeBranchRules() 統一轉為 BranchRule[]
 */
export type BranchConfig = BranchRule[] | { branchKey: string; routes: Record<string, string[]> }

/** 問卷設定 */
export interface DoneConfig {
  /** 是否顯示封測/報名表單（預設 false） */
  showWaitlist?: boolean
  /** 表單欄位開關 */
  waitlistFields?: { nickname?: boolean; email?: boolean; lineId?: boolean }
  /** 報名按鈕文字 */
  waitlistButtonText?: string
  /** 是否顯示故事卡片（預設 true） */
  showStoryCard?: boolean
  /** 是否顯示下載答題記錄按鈕 */
  showDownloadAnswers?: boolean
  /** 自訂 CTA 文案 */
  customCtaText?: string
  /** 自訂 CTA 連結 */
  customCtaUrl?: string
}

/** 測驗結果類型（用於爆款人格問卷） */
export interface ResultType {
  /** 唯一識別 key，例如 'guardian' | 'adventurer' */
  key: string
  /** 顯示名稱，例如「守護者」 */
  name: string
  /** 代表 emoji */
  emoji: string
  /** 描述文案（2-3 句） */
  description: string
  /** 特質標籤列表 */
  traits?: string[]
  /** 主題色（Tailwind 或 hex） */
  color?: string
}

/** 結果計分設定（只有人格/測驗問卷才需要） */
export interface ResultConfig {
  /**
   * 計分規則：題目 key → { 選項 value → 結果 typeKey }
   * 例如 { "q1": { "A": "guardian", "B": "adventurer" } }
   */
  scoringRules: Record<string, Record<string, string>>
  /** 所有可能的結果類型定義 */
  resultTypes: ResultType[]
  /** 平手時預設選哪個 typeKey（不設則取第一個）  */
  tieBreaker?: string
}

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
  /** 封面圖片 URL（上傳到 R2） */
  coverImageUrl?: string
  /** 是否有存取密碼（不回傳明文密碼） */
  hasPassword?: boolean
  /** AI 生成的填答進度稱號（5 個，由低到高） */
  gameTitles?: string[]
  /** 分流規則（若無則所有題目順序顯示） */
  branchConfig?: BranchConfig
  /** 完成頁設定 */
  doneConfig?: DoneConfig
  /** 結果計分設定（人格/測驗問卷專用） */
  resultConfig?: ResultConfig
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
  /** 分流路線（A/B/C），無分流時不帶 */
  route?: string
  /** LINE 身份簽名 token（從 LINE 點連結時帶入） */
  lineToken?: string
  /** 使用者同意將故事匿名展示於故事牆 */
  allowStoryWall?: boolean
}

/** UTM 參數 */
export interface UtmParams {
  source?: string
  medium?: string
  campaign?: string
}

// ===== 主題系統型別 =====

/** 可用主題 key */
export type SurveyTheme = 'default' | 'game' | 'cyber' | 'ancient' | 'sakura' | 'ocean' | 'forest' | 'candy' | 'noir'

/** 裝飾強度 1=輕量 2=標準 3=華麗 */
export type ThemeIntensity = 1 | 2 | 3

/** 問卷主題設定（DB row → 前端用） */
export interface ThemeSettings {
  surveySlug: string
  defaultTheme: SurveyTheme
  availableThemes: SurveyTheme[]
  allowUserChoice: boolean
  themeIntensity: Record<SurveyTheme, ThemeIntensity>
}
