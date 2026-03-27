/**
 * scripts/run-migrations.mjs
 * 執行所有待跑的 Supabase/PostgreSQL migrations
 * 用法：node scripts/run-migrations.mjs
 * 或指定單一檔案：node scripts/run-migrations.mjs supabase/run_all_pending.sql
 */

import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

// 載入 .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
config({ path: path.join(root, '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local')
  process.exit(1)
}

const { Pool } = pg
const pool = new Pool({ connectionString: DATABASE_URL, ssl: false })

async function runFile(filePath) {
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath)
  if (!fs.existsSync(absPath)) {
    console.error(`❌ File not found: ${absPath}`)
    return false
  }
  const sql = fs.readFileSync(absPath, 'utf-8')
  console.log(`\n▶ Running: ${path.relative(root, absPath)}`)
  try {
    await pool.query(sql)
    console.log(`✅ Done: ${path.basename(absPath)}`)
    return true
  } catch (err) {
    console.error(`❌ Failed: ${path.basename(absPath)}`)
    console.error(`   ${err.message}`)
    return false
  }
}

async function main() {
  const args = process.argv.slice(2)

  // 指定單一檔案
  if (args.length > 0) {
    for (const arg of args) {
      await runFile(arg)
    }
    await pool.end()
    return
  }

  // 預設：跑 run_all_pending.sql
  const defaultFile = 'supabase/run_all_pending.sql'
  console.log('🚀 Running consolidated migration: supabase/run_all_pending.sql')
  console.log(`   DB: ${DATABASE_URL.replace(/:([^:@]+)@/, ':***@')}`)

  const ok = await runFile(defaultFile)
  if (!ok) {
    // fallback：逐一跑 phase 檔案
    console.log('\n⚠️  Consolidated file failed. Trying individual phase files...')
    const supabaseDir = path.join(root, 'supabase')
    const files = fs.readdirSync(supabaseDir)
      .filter(f => f.endsWith('.sql') && f !== 'run_all_pending.sql')
      .sort()

    let passed = 0, failed = 0
    for (const file of files) {
      const success = await runFile(path.join(supabaseDir, file))
      if (success) passed++; else failed++
    }
    console.log(`\n📊 結果：${passed} 成功 / ${failed} 失敗`)
  }

  await pool.end()
  console.log('\n✨ Migration 完成')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
