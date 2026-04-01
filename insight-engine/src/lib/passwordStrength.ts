/**
 * 強密碼驗證：至少 8 碼、1 大寫、1 小寫、1 數字、1 特殊符號
 */
export function validateStrongPassword(pwd: string): { valid: boolean; message: string } {
  if (!pwd || pwd.length < 8) return { valid: false, message: '密碼至少 8 個字元' }
  if (!/[A-Z]/.test(pwd)) return { valid: false, message: '需包含至少 1 個大寫字母（A-Z）' }
  if (!/[a-z]/.test(pwd)) return { valid: false, message: '需包含至少 1 個小寫字母（a-z）' }
  if (!/\d/.test(pwd)) return { valid: false, message: '需包含至少 1 個數字（0-9）' }
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(pwd))
    return { valid: false, message: '需包含至少 1 個特殊符號（如 !@#$%）' }
  return { valid: true, message: '密碼強度良好 ✓' }
}

/**
 * 密碼強度等級（0-4）
 */
export function getPasswordStrengthLevel(pwd: string): number {
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(pwd)) score++
  return score
}
