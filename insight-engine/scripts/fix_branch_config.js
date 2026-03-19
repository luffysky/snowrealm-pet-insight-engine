const { Client } = require('pg')

async function main() {
  const client = new Client({
    host: '43.167.237.37',
    port: 30465,
    user: 'postgres',
    password: '3n25zPNSZyU64T9QrAmxX817WGk0RYwc',
    database: 'postgres',
    ssl: false,
  })

  await client.connect()

  const correctConfig = {
    branchKey: 'q1',
    routes: {
      A: ['有，現在正在養', '曾經養過'],
      B: ['沒有，但未來想養'],
      C: ['沒有，也暫時不考慮'],
    },
  }

  const res = await client.query(
    'UPDATE surveys SET branch_config = $1 WHERE id = $2',
    [JSON.stringify(correctConfig), '00000000-0000-0000-0000-000000000001']
  )
  console.log('Updated rows:', res.rowCount)

  // Verify
  const verify = await client.query(
    'SELECT branch_config FROM surveys WHERE id = $1',
    ['00000000-0000-0000-0000-000000000001']
  )
  console.log('Verified:', JSON.stringify(verify.rows[0].branch_config, null, 2))

  await client.end()
}

main().catch((err) => { console.error(err); process.exit(1) })
