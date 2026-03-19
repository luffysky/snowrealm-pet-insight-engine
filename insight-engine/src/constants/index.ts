// ===== 全域常數 =====

/** 預設分頁大小 */
export const DEFAULT_PAGE_SIZE = 20

/** Dashboard 趨勢天數 */
export const TREND_DAYS = 7

/** 問卷 slug */
export const MVP_SURVEY_SLUG = 'maoxingtianxia-mvp-survey'

/** 後台路由前綴 */
export const ADMIN_ROUTE_PREFIX = '/admin'

/** Q8 功能選項對照（用於統計顯示） */
export const FEATURE_LABELS: Record<string, string> = {
  '寵物專屬檔案': '寵物專屬檔案',
  '足跡時間線／回憶整理': '足跡時間線／回憶整理',
  'AI 陪伴／互動': 'AI 陪伴／互動',
  '離世紀念空間': '離世紀念空間',
  '看別人的寵物故事': '看別人的寵物故事',
  '認養／流浪動物資訊': '認養／流浪動物資訊',
  '未來提醒／重要日子紀錄': '未來提醒／重要日子紀錄',
}
