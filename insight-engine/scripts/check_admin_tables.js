const { Pool } = require('pg')
const p = new Pool({
  connectionString: 'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres',
  ssl: false,
})

async function main() {
  const tables = await p.query(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema='public' AND table_name IN ('admin_users','admin_invites','line_admins')`
  )
  console.log('Tables:', tables.rows)

  const cols = await p.query(
    `SELECT column_name, data_type FROM information_schema.columns 
     WHERE table_name='admin_users' ORDER BY ordinal_position`
  )
  console.log('admin_users columns:', cols.rows)

  await p.end()
}
main().catch(e => { console.error(e); process.exit(1) })
