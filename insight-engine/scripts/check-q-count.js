const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres'
});

(async () => {
  const s = await p.query('SELECT id, slug, title FROM surveys');
  for (const row of s.rows) {
    const q = await p.query('SELECT COUNT(*) as cnt FROM questions WHERE survey_id = $1', [row.id]);
    console.log(`${row.slug}: survey_id=${row.id}, questions=${q.rows[0].cnt}`);
  }
  await p.end();
})();
