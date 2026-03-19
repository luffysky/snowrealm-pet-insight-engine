const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
  host: '43.167.237.37',
  port: 30465,
  user: 'postgres',
  password: '3n25zPNSZyU64T9QrAmxX817WGk0RYwc',
  database: 'postgres',
  ssl: false,
});
(async () => {
  const sql = fs.readFileSync('./supabase/migration_phase7_broadcast.sql', 'utf-8');
  try {
    await pool.query(sql);
    console.log('Migration success!');
    const r1 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'broadcast_logs' ORDER BY ordinal_position");
    console.log('broadcast_logs columns:', JSON.stringify(r1.rows));
    const r2 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'line_users' ORDER BY ordinal_position");
    console.log('line_users columns:', JSON.stringify(r2.rows));
    const r3 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'responses' AND column_name = 'updated_at'");
    console.log('responses.updated_at:', r3.rows.length > 0 ? 'EXISTS' : 'MISSING');
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
  await pool.end();
})();
