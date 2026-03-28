/**
 * In-memory store for ephemeral DM events:
 * - Typing status (expires after 4s)
 * - Theme sync proposals (expire after 30s, consumed once)
 *
 * Works on single-process deployments (Zeabur). No DB migration needed.
 */

// ─── Typing status ────────────────────────────────────────────────
const typingMap = new Map<string, number>() // `fromId:toId` -> timestamp ms
const TYPING_TTL = 4_000

export function setTyping(fromId: string, toId: string): void {
  typingMap.set(`${fromId}:${toId}`, Date.now())
}

export function getIsTyping(fromId: string, toId: string): boolean {
  const ts = typingMap.get(`${fromId}:${toId}`)
  if (!ts) return false
  if (Date.now() - ts > TYPING_TTL) {
    typingMap.delete(`${fromId}:${toId}`)
    return false
  }
  return true
}

// ─── Theme sync ───────────────────────────────────────────────────
interface ThemeSyncEvent {
  themeKey: string
  fromId: string
  createdAt: number
}

const themeSyncMap = new Map<string, ThemeSyncEvent>() // toUserId -> event
const THEME_SYNC_TTL = 30_000

export function proposeThemeSync(fromId: string, toId: string, themeKey: string): void {
  themeSyncMap.set(toId, { themeKey, fromId, createdAt: Date.now() })
}

/** Returns and consumes the pending theme-sync event for this user, or null. */
export function pollThemeSync(userId: string): ThemeSyncEvent | null {
  const event = themeSyncMap.get(userId)
  if (!event) return null
  if (Date.now() - event.createdAt > THEME_SYNC_TTL) {
    themeSyncMap.delete(userId)
    return null
  }
  themeSyncMap.delete(userId)
  return event
}
