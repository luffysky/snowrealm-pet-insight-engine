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

    // 1) Q6 改為共用題
    const q6Route = await client.query(
      `UPDATE questions SET route = 'all' WHERE survey_id = $1 AND key = 'q6'`,
      [SURVEY_ID]
    );
    console.log('Q6 route => all:', q6Route.rowCount);

    // 2) 刪除誤插入的 Q6B / Q6C
    const removed = await client.query(
      `DELETE FROM questions WHERE survey_id = $1 AND key IN ('q6b', 'q6c')`,
      [SURVEY_ID]
    );
    console.log('Deleted q6b/q6c:', removed.rowCount);

    // 3) 校正題目順序：Q1=0, 分流題=1~4, Q6=5, Q7~Q11=6~10
    const updates = [
      ['q1', 0],
      ['q2', 1], ['q3', 2], ['q4', 3], ['q5', 4],
      ['q2b', 1], ['q3b', 2], ['q4b', 3], ['q5b', 4],
      ['q2c', 1], ['q3c', 2], ['q4c', 3], ['q5c', 4],
      ['q6', 5],
      ['q7', 6], ['q8', 7], ['q9', 8], ['q10', 9], ['q11', 10],
    ];

    for (const [key, orderIndex] of updates) {
      await client.query(
        `UPDATE questions SET order_index = $1 WHERE survey_id = $2 AND key = $3`,
        [orderIndex, SURVEY_ID, key]
      );
    }
    console.log('Order index fixed.');

    // 4) 共用題路線兜底
    const sharedRoute = await client.query(
      `UPDATE questions SET route = 'all' WHERE survey_id = $1 AND key IN ('q1', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11')`,
      [SURVEY_ID]
    );
    console.log('Shared route updates:', sharedRoute.rowCount);

    // 5) 分流配置兜底
    const branchConfig = {
      branchKey: 'q1',
      routes: {
        A: ['有，現在正在養', '曾經養過'],
        B: ['沒有，但未來想養'],
        C: ['沒有，也暫時不考慮'],
      },
    };

    await client.query(
      'UPDATE surveys SET branch_config = $1 WHERE id = $2',
      [JSON.stringify(branchConfig), SURVEY_ID]
    );
    console.log('Branch config updated.');

    await client.query('COMMIT');
    console.log('Done.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
