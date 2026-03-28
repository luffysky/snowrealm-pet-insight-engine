/**
 * 清理重複的問題（同 survey_id + key 只保留最早的一筆）
 * 用法：node scripts/dedup-questions.mjs [survey-slug]
 *       若不帶 slug 則處理所有問卷
 */
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
import './load-dotenv.mjs'

const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const slug = process.argv[2] ?? null
  const client = await pool.connect()
  try {
    // 找目標問卷
    let surveyRows
    if (slug) {
      surveyRows = await client.query(`SELECT id, slug FROM surveys WHERE slug = $1`, [slug])
    } else {
      surveyRows = await client.query(`SELECT id, slug FROM surveys ORDER BY created_at`)
    }

    if (!surveyRows.rows.length) {
      console.log('找不到符合的問卷')
      return
    }

    for (const survey of surveyRows.rows) {
      // 統計重複數量
      const countRes = await client.query(`
        SELECT key, COUNT(*) as cnt
        FROM questions
        WHERE survey_id = $1
        GROUP BY key
        HAVING COUNT(*) > 1
        ORDER BY key
      `, [survey.id])

      if (!countRes.rows.length) {
        console.log(`✅ ${survey.slug}：無重複題目`)
        continue
      }

      const totalDup = countRes.rows.reduce((sum, r) => sum + parseInt(r.cnt) - 1, 0)
      console.log(`\n⚠️  ${survey.slug} 有 ${countRes.rows.length} 個 key 重複，共多 ${totalDup} 筆：`)
      countRes.rows.forEach(r => console.log(`   key=${r.key} × ${r.cnt} 筆`))

      // 刪除重複，每個 key 只保留 created_at 最早的那筆
      const delRes = await client.query(`
        DELETE FROM questions
        WHERE id IN (
          SELECT id FROM (
            SELECT id,
              ROW_NUMBER() OVER (
                PARTITION BY survey_id, key
                ORDER BY created_at ASC, id ASC
              ) AS rn
            FROM questions
            WHERE survey_id = $1
          ) ranked
          WHERE rn > 1
        )
      `, [survey.id])

      console.log(`   🗑️  已刪除 ${delRes.rowCount} 筆重複題目`)

      // 重新算 order_index
      const remaining = await client.query(`
        SELECT id, key, order_index FROM questions
        WHERE survey_id = $1
        ORDER BY order_index ASC, key ASC
      `, [survey.id])
      console.log(`   ✅ 剩餘 ${remaining.rows.length} 題`)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
