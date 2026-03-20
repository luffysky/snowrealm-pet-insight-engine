const { Pool } = require('pg')
const p = new Pool({
  host: '43.167.237.37', port: 30465,
  user: 'postgres', password: '3n25zPNSZyU64T9QrAmxX817WGk0RYwc',
  database: 'postgres', ssl: false,
})

const q = `
  UPDATE survey_theme_settings
  SET available_themes = $1::jsonb,
      theme_intensity = $2::jsonb
  WHERE survey_slug = 'maoxingtianxia-mvp-survey'
`
const themes = JSON.stringify(['default','game','cyber','ancient','sakura','ocean','forest','candy','noir'])
const intensity = JSON.stringify({
  default: 2, game: 3, cyber: 3, ancient: 2, sakura: 2,
  ocean: 2, forest: 2, candy: 2, noir: 2,
})

p.query(q, [themes, intensity])
  .then(r => { console.log('Updated', r.rowCount, 'row(s)'); p.end() })
  .catch(e => { console.error(e.message); p.end() })
