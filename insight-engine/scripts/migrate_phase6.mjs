import pg from 'pg'

const DATABASE_URL = 'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres'

const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: false })

const statements = [
  // uuid extension
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
  // surveys 新增文案欄位
  `ALTER TABLE surveys ADD COLUMN IF NOT EXISTS subtitle TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE surveys ADD COLUMN IF NOT EXISTS cover_title TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE surveys ADD COLUMN IF NOT EXISTS cover_subtitle TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE surveys ADD COLUMN IF NOT EXISTS start_button_text TEXT NOT NULL DEFAULT '開始填寫'`,
  `ALTER TABLE surveys ADD COLUMN IF NOT EXISTS done_title TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE surveys ADD COLUMN IF NOT EXISTS done_subtitle TEXT NOT NULL DEFAULT ''`,
  // questions 新增 max_selections
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS max_selections INT`,
]

async function run() {
  const client = await pool.connect()
  try {
    for (const sql of statements) {
      console.log('> ', sql.slice(0, 80))
      await client.query(sql)
    }

    // Seed MVP survey
    console.log('> Seeding MVP survey...')
    await client.query(`
      INSERT INTO surveys (id, title, slug, status, subtitle, cover_title, cover_subtitle, start_button_text, done_title, done_subtitle)
      VALUES (
        '00000000-0000-0000-0000-000000000001',
        '毛行天下 MVP 問卷',
        'maoxingtianxia-mvp-survey',
        'published',
        '幫助我們打造更好的寵物紀錄平台',
        '如果有一天牠不在了，你還能留下什麼？',
        '我們正在設計一個真正能留下寵物足跡的地方。這份問卷不長，但你的回答，可能會幫助更多人留下重要的回憶。',
        '開始留下足跡',
        '你已經為牠留下了第一個足跡。',
        '謝謝你的回答。毛行天下想做的，不只是紀錄，而是讓那些重要的存在，不那麼容易被時間沖淡。'
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        status = EXCLUDED.status,
        subtitle = EXCLUDED.subtitle,
        cover_title = EXCLUDED.cover_title,
        cover_subtitle = EXCLUDED.cover_subtitle,
        start_button_text = EXCLUDED.start_button_text,
        done_title = EXCLUDED.done_title,
        done_subtitle = EXCLUDED.done_subtitle
    `)

    // Seed 12 questions
    console.log('> Seeding 12 questions...')
    const surveyId = '00000000-0000-0000-0000-000000000001'
    const questions = [
      { key: 'q1', type: 'single', content: '你目前是否有飼養寵物？', options: [{"label":"有","value":"有"},{"label":"曾經有（已離世）","value":"曾經有（已離世）"},{"label":"沒有但未來想養","value":"沒有但未來想養"},{"label":"沒有且暫時不考慮","value":"沒有且暫時不考慮"}], order: 0, required: true, max: null },
      { key: 'q2', type: 'multiple', content: '你的寵物類型是？（可複選）', options: [{"label":"狗","value":"狗"},{"label":"貓","value":"貓"},{"label":"倉鼠 / 小動物","value":"倉鼠 / 小動物"},{"label":"鳥類","value":"鳥類"},{"label":"水族","value":"水族"},{"label":"爬蟲","value":"爬蟲"},{"label":"其他","value":"其他"}], order: 1, required: true, max: null },
      { key: 'q3', type: 'multiple', content: '你平常會怎麼記錄寵物生活？（可複選）', options: [{"label":"拍照存在手機","value":"拍照存在手機"},{"label":"發 IG / FB / 社群","value":"發 IG / FB / 社群"},{"label":"寫日記 / 筆記","value":"寫日記 / 筆記"},{"label":"存在雲端相簿","value":"存在雲端相簿"},{"label":"幾乎不記錄","value":"幾乎不記錄"}], order: 2, required: true, max: null },
      { key: 'q4', type: 'single', content: '你多久會回頭看一次寵物照片或影片？', options: [{"label":"幾乎每天","value":"幾乎每天"},{"label":"一週幾次","value":"一週幾次"},{"label":"偶爾","value":"偶爾"},{"label":"幾乎不會","value":"幾乎不會"}], order: 3, required: true, max: null },
      { key: 'q5', type: 'single', content: '你是否曾經擔心，未來會忘記與寵物的重要回憶？', options: [{"label":"非常擔心","value":"非常擔心"},{"label":"有點擔心","value":"有點擔心"},{"label":"沒想過","value":"沒想過"},{"label":"不太在意","value":"不太在意"}], order: 4, required: true, max: null },
      { key: 'q6', type: 'single', content: '如果寵物離開，你最害怕的是什麼？', options: [{"label":"回憶慢慢變模糊","value":"回憶慢慢變模糊"},{"label":"沒有地方好好紀念","value":"沒有地方好好紀念"},{"label":"身邊沒人理解這種感受","value":"身邊沒人理解這種感受"},{"label":"突然失去生活重心","value":"突然失去生活重心"},{"label":"其他","value":"其他"}], order: 5, required: true, max: null },
      { key: 'q7', type: 'single', content: '如果有一個平台可以保存寵物的一生紀錄，甚至在某種程度上延續互動，你會有興趣嗎？', options: [{"label":"非常有興趣","value":"非常有興趣"},{"label":"可能會試試","value":"可能會試試"},{"label":"不確定","value":"不確定"},{"label":"沒興趣","value":"沒興趣"}], order: 6, required: true, max: null },
      { key: 'q8', type: 'single', content: '對這種服務，你比較可能接受哪種付費方式？', options: [{"label":"月費訂閱","value":"月費訂閱"},{"label":"一次性付費","value":"一次性付費"},{"label":"免費基本版 + 進階付費","value":"免費基本版 + 進階付費"},{"label":"不確定","value":"不確定"},{"label":"不會付費","value":"不會付費"}], order: 7, required: true, max: null },
      { key: 'q9', type: 'multiple', content: '以下功能你最有興趣的是哪些？（最多選 3 個）', options: [{"label":"寵物成長紀錄","value":"寵物成長紀錄"},{"label":"足跡時間線","value":"足跡時間線"},{"label":"AI 寵物互動","value":"AI 寵物互動"},{"label":"彩虹國紀念空間","value":"彩虹國紀念空間"},{"label":"寵物社群交流","value":"寵物社群交流"},{"label":"認養 / 流浪動物資訊","value":"認養 / 流浪動物資訊"},{"label":"商城 / 周邊","value":"商城 / 周邊"}], order: 8, required: true, max: 3 },
      { key: 'q10', type: 'single', content: '如果毛行天下是一個平台，你會多常使用？', options: [{"label":"每天","value":"每天"},{"label":"每週","value":"每週"},{"label":"偶爾","value":"偶爾"},{"label":"可能只用幾次","value":"可能只用幾次"},{"label":"幾乎不會用","value":"幾乎不會用"}], order: 9, required: true, max: null },
      { key: 'q11', type: 'text', content: '你覺得現在記錄寵物生活最大的問題是什麼？', options: [], order: 10, required: false, max: null },
      { key: 'q12', type: 'text', content: '如果只能留下與牠有關的一樣東西，你會選擇留下什麼？', options: [], order: 11, required: false, max: null },
    ]

    for (const q of questions) {
      await client.query(`
        INSERT INTO questions (id, survey_id, key, type, content, options, order_index, is_required, max_selections)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      `, [surveyId, q.key, q.type, q.content, JSON.stringify(q.options), q.order, q.required, q.max])
    }

    // Check if questions with same key already exist, if ON CONFLICT DO NOTHING skipped them, update them
    const existing = await client.query('SELECT key FROM questions WHERE survey_id = $1', [surveyId])
    console.log(`> Survey seeded. ${existing.rows.length} questions in DB.`)

    console.log('✅ Phase 6 migration complete!')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => { console.error(err); process.exit(1) })
