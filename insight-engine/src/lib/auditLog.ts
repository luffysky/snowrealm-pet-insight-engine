import { queryOne } from '@/lib/db'

export interface AuditEntry {
  actorId: string
  actorName?: string
  action: string
  targetType?: string
  targetId?: string
  details?: Record<string, unknown>
  ip?: string
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await queryOne(
      `INSERT INTO audit_logs (actor_id, actor_name, action, target_type, target_id, details, ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        entry.actorId,
        entry.actorName ?? null,
        entry.action,
        entry.targetType ?? null,
        entry.targetId ?? null,
        entry.details ? JSON.stringify(entry.details) : null,
        entry.ip ?? null,
      ]
    )
  } catch (err) {
    console.error('[audit] Failed to log:', err)
  }
}

export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers)
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headers.get('x-real-ip')
    || 'unknown'
}
