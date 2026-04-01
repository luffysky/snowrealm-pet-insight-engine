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

    // 1. Fix B-route order_index: q2b→1, q3b→2, q4b→3, q5b→4
    const bUpdates = [
      ['q2b', 1],
      ['q3b', 2],
      ['q4b', 3],
      ['q5b', 4],
    ];
    for (const [key, idx] of bUpdates) {
      await client.query(
        'UPDATE questions SET order_index = $1 WHERE key = $2 AND survey_id = $3',
        [idx, key, SURVEY_ID]
      );
    }
    console.log('Fixed B-route order_index (1-4)');

    // 2. Fix C-route order_index: q2c→1, q3c→2, q4c→3, q5c→4
    const cUpdates = [
      ['q2c', 1],
      ['q3c', 2],
      ['q4c', 3],
      ['q5c', 4],
    ];
    for (const [key, idx] of cUpdates) {
      await client.query(
        'UPDATE questions SET order_index = $1 WHERE key = $2 AND survey_id = $3',
        [idx, key, SURVEY_ID]
      );
    }
    console.log('Fixed C-route order_index (1-4)');

    // 3. Insert Q6B (B route, order_index=5)
    await client.query(
      `INSERT INTO questions (id, survey_id, key, type, content, options, order_index, is_required, max_selections, route)
       VALUES (uuid_generate_v4(), $1, 'q6b', 'single', '如果未來有了寵物，你最想為牠留下的是？', $2, 5, true, null, 'B')
       ON CONFLICT (survey_id, key) DO NOTHING`,
      [
        SURVEY_ID,
        JSON.stringify([
          { label: '照片和影片', value: '照片和影片' },
          { label: '成長過程紀錄', value: '成長過程紀錄' },
          { label: '跟牠相處的故事', value: '跟牠相處的故事' },
          { label: '還沒想過，但覺得會想記錄', value: '還沒想過，但覺得會想記錄' },
        ]),
      ]
    );
    console.log('Inserted Q6B');

    // 4. Insert Q6C (C route, order_index=5)
    await client.query(
      `INSERT INTO questions (id, survey_id, key, type, content, options, order_index, is_required, max_selections, route)
       VALUES (uuid_generate_v4(), $1, 'q6c', 'single', '如果你身邊有人很重視一隻寵物，你覺得最值得被留下的是？', $2, 5, true, null, 'C')
       ON CONFLICT (survey_id, key) DO NOTHING`,
      [
        SURVEY_ID,
        JSON.stringify([
          { label: '照片和影片', value: '照片和影片' },
          { label: '相處的故事', value: '相處的故事' },
          { label: '一種「牠存在過」的感覺', value: '一種「牠存在過」的感覺' },
          { label: '覺得不太需要特別留下什麼', value: '覺得不太需要特別留下什麼' },
        ]),
      ]
    );
    console.log('Inserted Q6C');

    await client.query('COMMIT');
    console.log('All done!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error:', e);
  } finally {
    client.release();
    pool.end();
  }
}

run();
