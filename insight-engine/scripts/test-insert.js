const { Client } = require('pg')

async function main() {
  const c = new Client({
    host: '43.167.237.37',
    port: 30465,
    database: 'postgres',
    user: 'postgres',
    password: '3n25zPNSZyU64T9QrAmxX817WGk0RYwc',
    ssl: false,
  })
  await c.connect()

  // Test as service_role
  await c.query('SET ROLE service_role')
  const who = await c.query("SELECT current_user, current_setting('role')")
  console.log('Current:', who.rows[0])

  try {
    const res = await c.query(
      "INSERT INTO responses (id, session_id, status, started_at, submitted_at) VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'pg-service-role-test', 'completed', NOW(), NOW()) RETURNING id"
    )
    console.log('Inserted:', res.rows)
  } catch (e) {
    console.error('Insert error:', e.message)
  }

  await c.query('RESET ROLE')
  const count = await c.query('SELECT count(*) FROM responses')
  console.log('Total responses:', count.rows[0].count)

  await c.end()
}

main().catch(console.error)
