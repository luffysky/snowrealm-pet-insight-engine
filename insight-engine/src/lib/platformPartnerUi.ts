/** 總後台「合作夥伴／平台禮遇」在 UI 上的統一文案（與 DB platform_unlimited 對應） */
export const PLATFORM_PARTNER_BADGE = '🌟 平台禮遇'
export const PLATFORM_PARTNER_BADGE_SHORT = '禮遇'
export const PLATFORM_PARTNER_DESCRIPTION =
  '由平台開通：本人使用時不套用一般方案額度（含 AI 與訂閱頁顯示之用量上限）。同組織其他成員仍依租戶方案。'

/**
 * 平台禮遇徽章的 Tailwind class。
 * 顏色由 CSS 變數 --badge-partner-* 控制，主題可在 globals.css 覆蓋。
 */
export const PLATFORM_PARTNER_BADGE_CLS =
  'badge-partner inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border'
