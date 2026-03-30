-- 平台級系統設定（不綁定租戶，super_admin 專用）
-- 用於儲存 Yukirin AI 指令設定等平台參數

CREATE TABLE IF NOT EXISTS platform_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 預設插入 yukirin_prompts 空設定
INSERT INTO platform_settings (key, value, description)
VALUES ('yukirin_prompts', '{}', 'Yukirin AI 角色指令設定（super_admin 可調整）')
ON CONFLICT (key) DO NOTHING;
