const { Client } = require('pg')

async function main() {
  const c = new Client({
    host: '43.167.237.37',
    port: 30465,
    database: 'postgres',
    user: 'postgres',
    password: '3n25zPNSZyU64T9QrAmxX817WGk0RYwc',
    ssl: false,
  })
  await c.connect()
  console.log('Connected')

  // Since PostgREST always runs as "anon" (JWT secret mismatch on Zeabur),
  // we need full CRUD policies for anon role.

  const tables = ['responses', 'answers', 'user_tags']

  for (const table of tables) {
    // Add SELECT policy for anon (admin reads)
    await c.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename='${table}' AND policyname='Allow anon select on ${table}'
        ) THEN
          EXECUTE format('CREATE POLICY "Allow anon select on %I" ON %I FOR SELECT TO anon USING (true)', '${table}', '${table}');
        END IF;
      END $$;
    `)
    console.log(`✅ SELECT policy on ${table}`)

    // Add UPDATE policy for anon
    await c.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename='${table}' AND policyname='Allow anon update on ${table}'
        ) THEN
          EXECUTE format('CREATE POLICY "Allow anon update on %I" ON %I FOR UPDATE TO anon USING (true) WITH CHECK (true)', '${table}', '${table}');
        END IF;
      END $$;
    `)
    console.log(`✅ UPDATE policy on ${table}`)

    // Add DELETE policy for anon
    await c.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename='${table}' AND policyname='Allow anon delete on ${table}'
        ) THEN
          EXECUTE format('CREATE POLICY "Allow anon delete on %I" ON %I FOR DELETE TO anon USING (true)', '${table}', '${table}');
        END IF;
      END $$;
    `)
    console.log(`✅ DELETE policy on ${table}`)
  }

  // surveys and admin_users: enable RLS + full anon access
  const extraTables = ['surveys', 'questions', 'admin_users']
  for (const table of extraTables) {
    await c.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`)
    await c.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename='${table}' AND policyname='Allow anon all on ${table}'
        ) THEN
          EXECUTE format('CREATE POLICY "Allow anon all on %I" ON %I FOR ALL TO anon USING (true) WITH CHECK (true)', '${table}', '${table}');
        END IF;
      END $$;
    `)
    console.log(`✅ ALL policy on ${table}`)
  }

  // Clean up test data
  await c.query("DELETE FROM responses WHERE session_id IN ('pg-service-role-test','raw-test','test-direct')")
  console.log('🧹 Cleaned test data')

  // Verify
  const policies = await c.query("SELECT tablename, policyname, roles, cmd FROM pg_policies WHERE schemaname='public' ORDER BY tablename, cmd")
  console.log('\n📋 Final policies:')
  policies.rows.forEach(p => console.log(`  ${p.tablename} | ${p.cmd.padEnd(8)} | ${p.roles} | ${p.policyname}`))

  await c.end()
}

main().catch(console.error)
