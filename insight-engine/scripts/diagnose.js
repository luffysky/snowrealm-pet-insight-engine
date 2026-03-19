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

  // Check RLS policies
  const rls = await c.query("SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename")
  console.log('=== RLS Policies ===')
  rls.rows.forEach(r => console.log(r.tablename, '|', r.policyname, '|', r.cmd))

  // Check if RLS is enabled
  const rlsEnabled = await c.query("SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('responses','answers','user_tags','surveys','questions')")
  console.log('\n=== RLS Enabled ===')
  rlsEnabled.rows.forEach(r => console.log(r.relname, r.relrowsecurity))

  // Test: try inserting as anon role
  try {
    await c.query('SET ROLE anon')
    const count = await c.query('SELECT count(*) FROM responses')
    console.log('\n=== anon can read responses:', count.rows[0].count)
  } catch(e) {
    console.log('\n=== anon cannot read responses:', e.message)
  }
  await c.query('RESET ROLE')

  // Check if there are webhook_endpoints
  try {
    const wh = await c.query('SELECT * FROM webhook_endpoints')
    console.log('\n=== Webhook endpoints ===')
    wh.rows.forEach(r => console.log(JSON.stringify(r)))
  } catch(e) {
    console.log('\n=== No webhook_endpoints table:', e.message)
  }

  // Check click_events table
  try {
    const clicks = await c.query('SELECT count(*) FROM click_events')
    console.log('\n=== Click events count:', clicks.rows[0].count)
  } catch(e) {
    console.log('\n=== click_events error:', e.message)
  }

  await c.end()
}
main().catch(e => console.error('ERROR:', e.message))
