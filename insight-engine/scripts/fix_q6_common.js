const { Pool } = require('pg');
const pool = new Pool({
  host: '43.167.237.37',
  port: 30465,
  user: 'postgres',
  password: '3n25zPNSZyU64T9QrAmxX817WGk0RYwc',
  database: 'postgres',
  ssl: false,
});

const SURVEY_ID = '00000000-0000-0000-0000-000000000001';

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Q6 改為共用題 (route='all')
    const r1 = await client.query(
      `UPDATE questions SET route = 'all' WHERE key = 'q6' AND survey_id = $1`,
      [SURVEY_ID]
    );
    console.log('Q6 set to all:', r1.rowCount);

    // 2. 刪除上一輪多插入的 Q6B / Q6C（結構改為 Q6 共用，不需要分流版）
    const r2 = await client.query(
      `DELETE FROM questions WHERE key IN ('q6b', 'q6c') AND survey_id = $1`,
      [SURVEY_ID]
    );
    console.log('Deleted Q6B/Q6C:', r2.rowCount);

    // 3. 驗證最終結構
    const verify = await client.query(
      `SELECT key, route, order_index FROM questions WHERE survey_id = $1 ORDER BY route, order_index`,
      [SURVEY_ID]
    );
    console.log('\nFinal structure:');
    verify.rows.forEach((q) => console.log(`  ${q.key}\troute=${q.route}\torder=${q.order_index}`));

    await client.query('COMMIT');
    console.log('\nDone!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error:', e);
  } finally {
    client.release();
    pool.end();
  }
}

run();
