import { queryOne } from '@/lib/db'

/**
 * 平台合作夥伴權限（總後台針對「單一 admin_users」開啟）
 * 僅在該 userId 發起的 API 請求生效，同租戶其他成員不受影響。
 */
export async function isUserPlatformUnlimited(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false
  try {
    const row = await queryOne<{ v: boolean }>(
      `SELECT platform_unlimited AS v FROM admin_users WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    )
    return row?.v === true
  } catch {
    // 尚未執行 migration_phase26 或欄位不存在時不阻斷其他 API
    return false
  }
}
