const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres'
});

(async () => {
  // Check surveys
  const s = await p.query('SELECT id, slug, tenant_id, title FROM surveys ORDER BY created_at');
  console.log('=== Surveys ===');
  console.table(s.rows);

  // Check questions per survey
  for (const survey of s.rows) {
    const q = await p.query(
      'SELECT * FROM questions WHERE survey_id = $1 LIMIT 5',
      [survey.id]
    );
    console.log(`\n=== Questions for "${survey.title}" (id=${survey.id}) === Count: ${q.rowCount}`);
    if (q.rowCount > 0) {
      console.table(q.rows);
    }
  }

  // Check if questions exist without a matching survey
  const orphan = await p.query(
    `SELECT q.id, q.survey_id, q.title FROM questions q
     LEFT JOIN surveys s ON q.survey_id = s.id
     WHERE s.id IS NULL`
  );
  console.log('\n=== Orphaned questions (no matching survey) ===', orphan.rowCount);
  if (orphan.rowCount > 0) console.table(orphan.rows);

  // Check all questions
  const all = await p.query('SELECT COUNT(*) as total FROM questions');
  console.log('\nTotal questions in DB:', all.rows[0].total);

  // Check questions table columns
  const cols = await p.query(
    `SELECT column_name, data_type FROM information_schema.columns 
     WHERE table_name = 'questions' ORDER BY ordinal_position`
  );
  console.log('\n=== Questions table schema ===');
  console.table(cols.rows);

  await p.end();
})();
