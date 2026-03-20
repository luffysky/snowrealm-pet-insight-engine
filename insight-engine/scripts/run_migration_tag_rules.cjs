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
  try {
    // 1. Create table
    const ddl = fs.readFileSync('./supabase/migration_phase7_tag_rules.sql', 'utf-8');
    await pool.query(ddl);
    console.log('tag_rules table created');

    // 2. Seed rules
    const seed = fs.readFileSync('./supabase/seed_tag_rules.sql', 'utf-8');
    await pool.query(seed);
    console.log('tag_rules seeded');

    // 3. Verify
    const count = await pool.query('SELECT COUNT(*) AS cnt FROM tag_rules');
    console.log('Total rules:', count.rows[0].cnt);

    const sample = await pool.query('SELECT question_key, answer_value, tag_key, tag_value FROM tag_rules LIMIT 5');
    console.log('Sample:', JSON.stringify(sample.rows, null, 2));
  } catch (err) {
    console.error('Failed:', err.message);
  }
  await pool.end();
})();
