const { Pool } = require('pg');
const pool = new Pool({
  host: '43.167.237.37',
  port: 30465,
  user: 'postgres',
  password: '3n25zPNSZyU64T9QrAmxX817WGk0RYwc',
  database: 'postgres',
  ssl: false,
});

const updates = [
  { key: 'q1', emoji: '🐾', narrative: '先告訴我們，你和毛孩的關係吧！' },
  { key: 'q2', emoji: '🏠', narrative: '你的小窩裡，有多少位毛茸茸的室友呢？' },
  { key: 'q2b', emoji: '📸', narrative: '想像一下未來和毛孩的生活...' },
  { key: 'q2c', emoji: '💭', narrative: '理解你的考量，讓我們更懂你' },
  { key: 'q3', emoji: '📱', narrative: '每個回憶都值得被好好保存' },
  { key: 'q3b', emoji: '🌟', narrative: '那些閃閃發光的瞬間...' },
  { key: 'q3c', emoji: '👥', narrative: '身邊的毛孩故事' },
  { key: 'q4', emoji: '🕰️', narrative: '時光匣子裡的珍貴畫面' },
  { key: 'q4b', emoji: '📖', narrative: '成長的每一步都如此珍貴' },
  { key: 'q4c', emoji: '💛', narrative: '毛孩是家人，是朋友，是陪伴' },
  { key: 'q5', emoji: '💭', narrative: '記憶如同河流，總在慢慢流淌...' },
  { key: 'q5b', emoji: '🗺️', narrative: '一個專屬毛孩的時光寶盒' },
  { key: 'q5c', emoji: '✨', narrative: '記錄，是一種溫柔的力量' },
  { key: 'q6', emoji: '🎯', narrative: '如果只能留下一種，你會選什麼？' },
  { key: 'q7', emoji: '🏡', narrative: '想像這樣一個溫暖的地方...' },
  { key: 'q8', emoji: '🎁', narrative: '你最期待的功能是什麼？' },
  { key: 'q9', emoji: '💎', narrative: '價值與價格的平衡' },
  { key: 'q10', emoji: '🌈', narrative: '你心中理想的毛行天下' },
  { key: 'q11', emoji: '✍️', narrative: '說一句最想留下的話' },
];

(async () => {
  const client = await pool.connect();
  try {
    // Add emoji, narrative, chapter columns if not exist
    await client.query(`
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS emoji TEXT;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS narrative TEXT;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS chapter TEXT;
    `);
    console.log('Columns ensured.');

    for (const u of updates) {
      const r = await client.query(
        'UPDATE questions SET emoji = $1, narrative = $2 WHERE key = $3',
        [u.emoji, u.narrative, u.key]
      );
      console.log(u.key, ':', r.rowCount, 'rows');
    }
    console.log('Done!');
  } finally {
    client.release();
    pool.end();
  }
})();
