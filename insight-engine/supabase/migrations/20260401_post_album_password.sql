-- 貼文（長/短）+ 相簿密碼保護
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE user_albums ADD COLUMN IF NOT EXISTS password_hash TEXT;
