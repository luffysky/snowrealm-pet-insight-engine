-- ===== 毛行天下問卷系統 — Supabase 資料庫初始化 =====
-- 在 Supabase SQL Editor 中執行此檔案

-- UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. surveys 問卷表
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. questions 題目表
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single', 'multiple', 'text')),
  content TEXT NOT NULL,
  options JSONB DEFAULT '[]',
  order_index INT NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. responses 填答表
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- 4. answers 答案表
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  question_key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. user_tags 使用者標籤表
CREATE TABLE IF NOT EXISTS user_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  user_id UUID,
  tag_key TEXT NOT NULL,
  tag_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. admin_users 管理員表（可選）
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== 索引 =====
CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);
CREATE INDEX IF NOT EXISTS idx_responses_utm_source ON responses(utm_source);
CREATE INDEX IF NOT EXISTS idx_answers_response_id ON answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_key ON answers(question_key);
CREATE INDEX IF NOT EXISTS idx_user_tags_response_id ON user_tags(response_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag_key ON user_tags(tag_key);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag_key_value ON user_tags(tag_key, tag_value);

-- ===== RLS（Row Level Security）=====
-- 前台提交用：允許匿名 insert
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;

-- 允許匿名用戶 insert（前端提交問卷）
CREATE POLICY "Allow anonymous insert on responses"
  ON responses FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous insert on answers"
  ON answers FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous insert on user_tags"
  ON user_tags FOR INSERT
  TO anon
  WITH CHECK (true);

-- 後台讀取透過 service_role key 繞過 RLS，不需要額外 policy
