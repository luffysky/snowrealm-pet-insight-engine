const { Pool } = require('pg')
const fs = require('fs')

const pool = new Pool({
  connectionString: 'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres',
  ssl: false,
})

async function main() {
  const sql = fs.readFileSync('supabase/migration_phase16_email_verification.sql', 'utf8')
  await pool.query(sql)
  console.log('Phase 16 migration applied')

  const r = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='email_verification_codes' ORDER BY ordinal_position"
  )
  console.log('email_verification_codes columns:', r.rows.map(function(row) { return row.column_name }))

  const r2 = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='admin_users' AND column_name='email'"
  )
  console.log('admin_users.email exists:', r2.rows.length > 0)

  await pool.end()
}

main().catch(function(e) { console.error(e); process.exit(1) })
