const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres',
  ssl: false,
});

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS line_notification_styles (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      header_color TEXT NOT NULL DEFAULT '#0e7990',
      header_emoji TEXT NOT NULL DEFAULT '',
      header_text TEXT NOT NULL DEFAULT '',
      body_fields JSONB NOT NULL DEFAULT '[]',
      footer_label TEXT NOT NULL DEFAULT '',
      footer_url TEXT NOT NULL DEFAULT '',
      footer_color TEXT NOT NULL DEFAULT '#0e7990',
      is_active BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const styles = [
    {
      id: 'survey_submitted',
      label: '新問卷回覆',
      header_color: '#0e7990',
      header_emoji: '📋',
      header_text: '新問卷回覆！',
      footer_label: '查看詳情',
      footer_url: '/admin/responses/{{response_id}}',
      footer_color: '#0e7990',
    },
    {
      id: 'waitlist_joined',
      label: '新封測申請',
      header_color: '#047e57',
      header_emoji: '🎉',
      header_text: '新封測申請！',
      footer_label: '查看名單',
      footer_url: '/admin/waitlist',
      footer_color: '#047e57',
    },
    {
      id: 'rule_admin',
      label: '規則觸發（管理員）',
      header_color: '#7c3aed',
      header_emoji: '🔔',
      header_text: '通知觸發！',
      footer_label: '查看詳情',
      footer_url: '/admin/responses/{{response_id}}',
      footer_color: '#7c3aed',
    },
    {
      id: 'rule_user',
      label: '規則觸發（用戶）',
      header_color: '#2563eb',
      header_emoji: '💌',
      header_text: '感謝你的回覆',
      footer_label: '查看更多',
      footer_url: '/survey',
      footer_color: '#2563eb',
    },
    {
      id: 'weekly_report',
      label: '週報摘要',
      header_color: '#1a365d',
      header_emoji: '📊',
      header_text: '週報摘要',
      footer_label: '',
      footer_url: '',
      footer_color: '#1a365d',
    },
    {
      id: 'remind',
      label: '問卷提醒',
      header_color: '#d97706',
      header_emoji: '🐾',
      header_text: '問卷還沒填完喔！',
      footer_label: '繼續填寫',
      footer_url: '/survey',
      footer_color: '#d97706',
    },
    {
      id: 'broadcast',
      label: '群發推播',
      header_color: '#059669',
      header_emoji: '📢',
      header_text: '最新消息',
      footer_label: '了解更多',
      footer_url: '/',
      footer_color: '#059669',
    },
    {
      id: 'follow_welcome',
      label: '加好友歡迎',
      header_color: '#ec4899',
      header_emoji: '🎀',
      header_text: '歡迎加入毛行天下！',
      footer_label: '',
      footer_url: '',
      footer_color: '#ec4899',
    },
  ];

  for (const s of styles) {
    await pool.query(
      `INSERT INTO line_notification_styles (id, label, header_color, header_emoji, header_text, footer_label, footer_url, footer_color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [s.id, s.label, s.header_color, s.header_emoji, s.header_text, s.footer_label, s.footer_url, s.footer_color]
    );
  }

  const { rows } = await pool.query('SELECT id, label, header_color, header_emoji FROM line_notification_styles ORDER BY id');
  console.log('Notification styles:', rows.length);
  rows.forEach(r => console.log(`  ${r.id}: ${r.header_emoji} ${r.label} (${r.header_color})`));
  await pool.end();
}

main().catch(console.error);
