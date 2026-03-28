/**
 * In-memory store for ephemeral DM events:
 * - Typing status (expires after 4s)
 *
 * Theme sync proposals are now persisted to direct_messages table
 * so recipients receive them even when offline.
 *
 * Works on single-process deployments (Zeabur).
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
