const { Pool } = require('pg')
const p = new Pool({
  connectionString: 'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres',
  ssl: false,
})

async function main() {
  const cols = await p.query(
    `SELECT column_name, is_nullable, column_default 
     FROM information_schema.columns 
     WHERE table_name = 'admin_users' 
     ORDER BY ordinal_position`
  )
  console.log('admin_users columns:')
  console.table(cols.rows)

  // Fix: make email nullable
  await p.query(`ALTER TABLE admin_users ALTER COLUMN email DROP NOT NULL`)
  console.log('✅ email is now nullable')

  // Also drop unique constraint on email if it exists (allow null duplicates)
  // Check existing data
  const data = await p.query(`SELECT * FROM admin_users`)
  console.log('Current rows:', data.rows.length)

  await p.end()
}
main().catch(e => { console.error(e); process.exit(1) })
