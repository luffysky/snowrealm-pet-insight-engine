const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres'
});

const OLD_TENANT = 'maoxingtianxia';
const NEW_TENANT = 'snowrealm-pet';

async function main() {
  const client = await pool.connect();
  try {
    // Find all tables with tenant_id
    const { rows: tables } = await client.query(
      `SELECT table_name FROM information_schema.columns 
       WHERE column_name = 'tenant_id' AND table_schema = 'public' 
       ORDER BY table_name`
    );

    console.log('\n=== Before Migration ===');
    for (const { table_name } of tables) {
      const { rows } = await client.query(
        `SELECT COUNT(*) as cnt FROM "${table_name}" WHERE tenant_id = $1`,
        [OLD_TENANT]
      );
      if (parseInt(rows[0].cnt) > 0) {
        console.log(`${table_name}: ${rows[0].cnt} rows (${OLD_TENANT})`);
      }
    }

    // Tables where snowrealm-pet already has a row (unique constraint on tenant_id)
    // For these, delete the old tenant's row (keep the new tenant's row)
    const UNIQUE_TENANT_TABLES = ['site_settings'];

    // Tables where we should merge (delete old tenant row, keep new tenant data)
    // admin_users: the new tenant already has users from registration
    const MERGE_SKIP_TABLES = ['admin_users'];

    // Migrate all data
    console.log('\n=== Migrating ===');
    await client.query('BEGIN');

    for (const { table_name } of tables) {
      if (UNIQUE_TENANT_TABLES.includes(table_name)) {
        // Delete old tenant's row (new tenant already has one)
        const del = await client.query(
          `DELETE FROM "${table_name}" WHERE tenant_id = $1`,
          [OLD_TENANT]
        );
        if (del.rowCount > 0) {
          console.log(`🔄 ${table_name}: deleted ${del.rowCount} old rows (kept ${NEW_TENANT})`);
        }
      } else if (MERGE_SKIP_TABLES.includes(table_name)) {
        // For admin_users, update only those that don't conflict on email
        const result = await client.query(
          `UPDATE "${table_name}" SET tenant_id = $1 
           WHERE tenant_id = $2 
           AND email NOT IN (SELECT email FROM "${table_name}" WHERE tenant_id = $1)`,
          [NEW_TENANT, OLD_TENANT]
        );
        // Delete remaining old tenant users (duplicates)
        const del = await client.query(
          `DELETE FROM "${table_name}" WHERE tenant_id = $1`,
          [OLD_TENANT]
        );
        console.log(`🔄 ${table_name}: migrated ${result.rowCount}, removed ${del.rowCount} duplicates`);
      } else {
        const result = await client.query(
          `UPDATE "${table_name}" SET tenant_id = $1 WHERE tenant_id = $2`,
          [NEW_TENANT, OLD_TENANT]
        );
        if (result.rowCount > 0) {
          console.log(`✅ ${table_name}: ${result.rowCount} rows migrated`);
        }
      }
    }

    await client.query('COMMIT');
    console.log('\n=== Migration Complete ===');

    // Verify
    console.log('\n=== After Migration ===');
    for (const { table_name } of tables) {
      const { rows } = await client.query(
        `SELECT COUNT(*) as cnt FROM "${table_name}" WHERE tenant_id = $1`,
        [NEW_TENANT]
      );
      if (parseInt(rows[0].cnt) > 0) {
        console.log(`${table_name}: ${rows[0].cnt} rows (${NEW_TENANT})`);
      }
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
