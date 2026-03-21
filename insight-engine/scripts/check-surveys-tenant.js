const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres'
});

(async () => {
  const s = await p.query('SELECT id, slug, title, tenant_id, is_primary, status FROM surveys ORDER BY created_at DESC');
  console.log('=== Surveys ===');
  for (const row of s.rows) {
    console.log(`  ${row.slug} | tenant=${row.tenant_id} | primary=${row.is_primary} | status=${row.status}`);
  }
  
  // Check getTenantContext behavior - what tenant_id does the admin get?
  const tenants = await p.query('SELECT DISTINCT tenant_id FROM surveys');
  console.log('\n=== Distinct tenant_ids in surveys ===');
  for (const r of tenants.rows) console.log(`  ${r.tenant_id}`);

  await p.end();
})();
