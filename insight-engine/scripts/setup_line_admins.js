const { Client } = require('pg');
const c = new Client({
  host: '43.167.237.37', port: 30465,
  user: 'postgres', password: '3n25zPNSZyU64T9QrAmxX817WGk0RYwc',
  database: 'postgres', ssl: false,
});

(async () => {
  await c.connect();

  // 建立 line_admins 表
  await c.query(`
    CREATE TABLE IF NOT EXISTS line_admins (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      line_user_id TEXT UNIQUE NOT NULL,
      display_name TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✅ line_admins table created');

  // 把現有的 env 管理員也加進去
  const envAdminId = 'Ub73d29855e56e21bc1e6adf6c82c0747';
  await c.query(`
    INSERT INTO line_admins (line_user_id, display_name)
    VALUES ($1, '主管理員')
    ON CONFLICT (line_user_id) DO NOTHING
  `, [envAdminId]);
  console.log('✅ env admin seeded');

  const { rows } = await c.query('SELECT * FROM line_admins');
  console.log('current admins:', rows);

  await c.end();
})();
