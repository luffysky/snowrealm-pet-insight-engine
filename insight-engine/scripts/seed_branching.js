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

    // 1. Set Q2-Q6 route to 'A'
    const r1 = await client.query(
      `UPDATE questions SET route = 'A' WHERE key IN ('q2','q3','q4','q5','q6') AND survey_id = $1`,
      [SURVEY_ID]
    );
    console.log('Updated A-route questions:', r1.rowCount);

    // 2. Insert B-route questions (Q2B-Q5B)
    const bQuestions = [
      {
        key: 'q2b', type: 'multiple',
        content: '如果未來你養寵物，你覺得你會怎麼記錄牠？（可複選）',
        order_index: 11, is_required: true, max_selections: null,
        options: [
          { label: '拍照／影片', value: '拍照／影片' },
          { label: '發社群', value: '發社群' },
          { label: '寫文字或日記', value: '寫文字或日記' },
          { label: '可能不太會特別記錄', value: '可能不太會特別記錄' },
          { label: '還沒想過', value: '還沒想過' },
        ],
      },
      {
        key: 'q3b', type: 'single',
        content: '你會不會覺得，有些重要的生活回憶，其實很容易被忽略？',
        order_index: 12, is_required: true, max_selections: null,
        options: [
          { label: '會', value: '會' },
          { label: '有一點', value: '有一點' },
          { label: '不太會', value: '不太會' },
          { label: '沒想過', value: '沒想過' },
        ],
      },
      {
        key: 'q4b', type: 'single',
        content: '如果未來有寵物，你會在意「牠的成長被好好記錄」嗎？',
        order_index: 13, is_required: true, max_selections: null,
        options: [
          { label: '很在意', value: '很在意' },
          { label: '還不錯', value: '還不錯' },
          { label: '普通', value: '普通' },
          { label: '不太在意', value: '不太在意' },
        ],
      },
      {
        key: 'q5b', type: 'single',
        content: '如果有一個地方，可以幫你整理寵物的一生足跡，你會有興趣嗎？',
        order_index: 14, is_required: true, max_selections: null,
        options: [
          { label: '很有興趣', value: '很有興趣' },
          { label: '可能會試試看', value: '可能會試試看' },
          { label: '不確定', value: '不確定' },
          { label: '沒什麼興趣', value: '沒什麼興趣' },
        ],
      },
    ];

    for (const q of bQuestions) {
      await client.query(
        `INSERT INTO questions (id, survey_id, key, type, content, options, order_index, is_required, max_selections, route)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (survey_id, key) DO NOTHING`,
        [SURVEY_ID, q.key, q.type, q.content, JSON.stringify(q.options), q.order_index, q.is_required, q.max_selections, 'B']
      );
    }
    console.log('Inserted 4 B-route questions (skipped existing)');

    // 3. Insert C-route questions (Q2C-Q5C)
    const cQuestions = [
      {
        key: 'q2c', type: 'multiple',
        content: '你目前沒有考慮養寵物，主要原因是？（可複選）',
        order_index: 15, is_required: true, max_selections: null,
        options: [
          { label: '時間不夠', value: '時間不夠' },
          { label: '經濟因素', value: '經濟因素' },
          { label: '居住環境不適合', value: '居住環境不適合' },
          { label: '沒有特別興趣', value: '沒有特別興趣' },
          { label: '曾經有不好的經驗', value: '曾經有不好的經驗' },
          { label: '其他', value: '其他' },
        ],
      },
      {
        key: 'q3c', type: 'single',
        content: '你身邊是否有親友養寵物？',
        order_index: 16, is_required: true, max_selections: null,
        options: [
          { label: '有，而且很親近', value: '有，而且很親近' },
          { label: '有，但沒有特別接觸', value: '有，但沒有特別接觸' },
          { label: '幾乎沒有', value: '幾乎沒有' },
        ],
      },
      {
        key: 'q4c', type: 'single',
        content: '你會不會覺得，寵物對某些人來說，是很重要的存在？',
        order_index: 17, is_required: true, max_selections: null,
        options: [
          { label: '很認同', value: '很認同' },
          { label: '還算認同', value: '還算認同' },
          { label: '普通', value: '普通' },
          { label: '不太認同', value: '不太認同' },
        ],
      },
      {
        key: 'q5c', type: 'single',
        content: '如果有一個地方，是用來記錄寵物一生的故事，你覺得這樣的東西：',
        order_index: 18, is_required: true, max_selections: null,
        options: [
          { label: '很有意義', value: '很有意義' },
          { label: '還不錯', value: '還不錯' },
          { label: '普通', value: '普通' },
          { label: '沒什麼感覺', value: '沒什麼感覺' },
        ],
      },
    ];

    for (const q of cQuestions) {
      await client.query(
        `INSERT INTO questions (id, survey_id, key, type, content, options, order_index, is_required, max_selections, route)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (survey_id, key) DO NOTHING`,
        [SURVEY_ID, q.key, q.type, q.content, JSON.stringify(q.options), q.order_index, q.is_required, q.max_selections, 'C']
      );
    }
    console.log('Inserted 4 C-route questions (skipped existing)');

    // 4. Set branch_config on MVP survey
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
    console.log('Set branch_config on MVP survey');

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
