/**
 * 管理員動態註冊 — DB 遷移
 * 1. admin_users 加入 username, password_hash, display_name, line_user_id
 * 2. 建立 admin_invites 表（一次性邀請 token）
 */
const { Pool } = require('pg')

const p = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres',
  ssl: false,
})

async function main() {
  // 1. admin_users 加欄位
  await p.query(`
    ALTER TABLE admin_users 
      ADD COLUMN IF NOT EXISTS username TEXT,
      ADD COLUMN IF NOT EXISTS password_hash TEXT,
      ADD COLUMN IF NOT EXISTS display_name TEXT,
      ADD COLUMN IF NOT EXISTS line_user_id TEXT
  `)
  console.log('✅ admin_users: added username, password_hash, display_name, line_user_id')

  // 加 unique constraint（如果不存在）
  const idx = await p.query(`
    SELECT indexname FROM pg_indexes 
    WHERE tablename = 'admin_users' AND indexname = 'admin_users_username_key'
  `)
  if (idx.rows.length === 0) {
    await p.query(`CREATE UNIQUE INDEX admin_users_username_key ON admin_users (username) WHERE username IS NOT NULL`)
    console.log('✅ admin_users: added unique index on username')
  }

  // 2. admin_invites 表
  await p.query(`
    CREATE TABLE IF NOT EXISTS admin_invites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token TEXT NOT NULL UNIQUE,
      line_user_id TEXT NOT NULL,
      display_name TEXT,
      used BOOLEAN DEFAULT false,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  console.log('✅ admin_invites table created')

  // 驗證
  const cols = await p.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'admin_users' ORDER BY ordinal_position
  `)
  console.log('admin_users columns:', cols.rows.map(r => r.column_name))

  await p.end()
  console.log('\n🎉 Migration complete!')
}

main().catch(e => { console.error(e); process.exit(1) })
