const { Pool } = require('pg')
const fs = require('fs')

const pool = new Pool({
  connectionString: 'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres',
  ssl: false,
})

async function main() {
  const sql = fs.readFileSync('supabase/migration_phase15_site_settings.sql', 'utf8')
  await pool.query(sql)
  console.log('Phase 15 migration applied')

  const r1 = await pool.query('SELECT count(*) FROM site_settings')
  console.log('site_settings rows:', r1.rows[0].count)

  const r2 = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='media_assets' ORDER BY ordinal_position"
  )
  console.log('media_assets columns:', r2.rows.map(r => r.column_name))

  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
