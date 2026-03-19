const { Client } = require('pg')
async function main() {
  const c = new Client({ host: '43.167.237.37', port: 30465, user: 'postgres', password: '3n25zPNSZyU64T9QrAmxX817WGk0RYwc', database: 'postgres', ssl: false })
  await c.connect()
  const r = await c.query('SELECT key, route, content, order_index FROM questions WHERE survey_id = $1 ORDER BY route, order_index', ['00000000-0000-0000-0000-000000000001'])
  console.log(JSON.stringify(r.rows, null, 2))
  await c.end()
}
main()
