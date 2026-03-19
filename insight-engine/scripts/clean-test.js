const { Pool } = require('pg')
const p = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres',
  ssl: false
})

async function main() {
  const r = await p.query(
    "DELETE FROM responses WHERE id = '11111111-1111-1111-1111-111111111111'"
  )
  console.log('Deleted', r.rowCount, 'test rows')
  await p.end()
}

main().catch(e => { console.error(e); process.exit(1) })
