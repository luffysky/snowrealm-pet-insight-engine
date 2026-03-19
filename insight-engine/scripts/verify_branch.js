const { Pool } = require('pg');
const pool = new Pool({
  host: '43.167.237.37', port: 30465, user: 'postgres',
  password: '3n25zPNSZyU64T9QrAmxX817WGk0RYwc', database: 'postgres', ssl: false,
});

async function run() {
  // Verify branch_config
  const r1 = await pool.query(
    'SELECT branch_config FROM surveys WHERE id = $1',
    ['00000000-0000-0000-0000-000000000001']
  );
  console.log('branch_config:', JSON.stringify(r1.rows[0].branch_config, null, 2));

  // Verify Q1 options
  const r2 = await pool.query(
    'SELECT options FROM questions WHERE key = $1',
    ['q1']
  );
  const opts = typeof r2.rows[0].options === 'string'
    ? JSON.parse(r2.rows[0].options)
    : r2.rows[0].options;
  console.log('\nQ1 options:', opts.map(o => o.value));

  pool.end();
}
run();
