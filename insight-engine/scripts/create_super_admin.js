const crypto = require('crypto');
const { Client } = require('pg');

const USERNAME = 'snowadmin';
const PASSWORD = 'SnowRealm2025!';
const DISPLAY_NAME = 'SnowRealm 管理員';

async function main() {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await new Promise((resolve, reject) => {
    crypto.scrypt(PASSWORD, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => {
      if (err) reject(err);
      else resolve(salt + ':' + key.toString('hex'));
    });
  });

  const client = new Client({
    host: '43.167.237.37', port: 30465,
    user: 'postgres', password: '3n25zPNSZyU64T9QrAmxX817WGk0RYwc',
    database: 'postgres', ssl: false,
  });
  await client.connect();

  const existing = await client.query(
    "SELECT id, username FROM admin_users WHERE role = 'super_admin' LIMIT 1"
  );
  if (existing.rows.length > 0) {
    console.log('已有 super_admin:', existing.rows[0].username);
    await client.end();
    return;
  }

  await client.query(
    `INSERT INTO admin_users (username, password_hash, display_name, role, tenant_id, email)
     VALUES ($1, $2, $3, 'super_admin', 'maoxingtianxia', 'admin@snowrealm.pet')`,
    [USERNAME, hash, DISPLAY_NAME]
  );

  console.log('✅ super_admin 建立成功！');
  console.log('帳號:', USERNAME);
  console.log('密碼:', PASSWORD);
  console.log('⚠️  請登入後立即修改密碼');
  await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
