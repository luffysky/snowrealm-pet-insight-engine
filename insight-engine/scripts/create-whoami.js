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

  await c.query(`
    CREATE OR REPLACE FUNCTION public.whoami()
    RETURNS json
    LANGUAGE sql
    SECURITY INVOKER
    AS $$
      SELECT json_build_object('current_user', current_user, 'role_setting', current_setting('role'))
    $$
  `)
  console.log('Function created')

  await c.query('GRANT EXECUTE ON FUNCTION public.whoami() TO anon, authenticated, service_role')
  console.log('Granted')

  // Notify PostgREST to reload schema cache
  await c.query('NOTIFY pgrst, \'reload schema\'')
  console.log('Schema reload notified')

  await c.end()
}

main().catch(console.error)
