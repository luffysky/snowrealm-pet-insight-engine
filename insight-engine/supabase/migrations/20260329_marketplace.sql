-- ── 市集商品表 ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('sticker_pack','background','theme','emoji_pack','survey_template')),
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,          -- 封面圖 URL
  tags TEXT[] DEFAULT '{}',

  -- 定價
  price_zcoin INT NOT NULL DEFAULT 0,

  -- 創作者（NULL = 平台官方）
  creator_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  creator_name TEXT,
  creator_revenue_pct INT NOT NULL DEFAULT 70,   -- 創作者分潤 %

  -- 內容指向
  ref_id TEXT,               -- sticker_pack_id | background_id | theme_key | template_id
  content_json JSONB,        -- 主題定義等（不參照其他表時直接存）

  -- 上架狀態
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_official BOOLEAN NOT NULL DEFAULT false,   -- 平台官方內容

  -- 統計
  purchase_count INT NOT NULL DEFAULT 0,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,

  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_type_active ON marketplace_items (type, is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_featured ON marketplace_items (is_featured) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_marketplace_creator ON marketplace_items (creator_id) WHERE creator_id IS NOT NULL;

-- ── 購買紀錄 ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  price_paid INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_mp_purchases_user ON marketplace_purchases (user_id);
CREATE INDEX IF NOT EXISTS idx_mp_purchases_item ON marketplace_purchases (item_id);

-- ── 創作者分潤紀錄 ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES marketplace_purchases(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earnings_creator ON creator_earnings (creator_id, status);

-- ── 商品評分 ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (item_id, user_id)
);

-- ── 貼圖包新增 emoji 類型欄位 ──────────────────────────────────────────────────
ALTER TABLE sticker_packs ADD COLUMN IF NOT EXISTS pack_type TEXT NOT NULL DEFAULT 'sticker';
-- pack_type: 'sticker' | 'emoji'
-- emoji 包 = 表情貼，尺寸 240x240，用在訊息欄位旁快速插入

-- ── 初始化平台背景 / 主題 marketplace items ─────────────────────────────────────
INSERT INTO marketplace_items (type, name, description, preview_url, price_zcoin, is_official, is_active, ref_id, sort_order)
VALUES
  ('background','深空','深邃的太空背景',NULL,0,true,true,'default',1),
  ('background','海洋','湛藍海洋背景',NULL,0,true,true,'ocean',2),
  ('background','櫻花','飄落的粉紅櫻花',NULL,0,true,true,'sakura',3),
  ('background','賽博','未來感網格背景',NULL,0,true,true,'cyber',4),
  ('background','森林','幽靜綠色森林',NULL,0,true,true,'forest',5),
  ('background','日落','暖色調日落光景',NULL,0,true,true,'sunset',6),
  ('background','月夜','繁星閃爍月夜',NULL,0,true,true,'night',7),
  ('background','琥珀','溫暖琥珀色調',NULL,0,true,true,'amber',8),
  ('background','糖果','夢幻糖果泡泡',NULL,0,true,true,'candy',9),
  ('background','楓葉','飄落楓葉秋景',NULL,0,true,true,'maple',10),
  ('background','暴雪','紛飛雪花暴雪',NULL,0,true,true,'blizzard',11),
  ('background','螢火蟲','夏夜螢火蟲光',NULL,0,true,true,'firefly',12),
  ('background','極光','絢麗北極光',NULL,0,true,true,'aurora',13),
  ('background','花瓣雨','浪漫花瓣飄落',NULL,0,true,true,'petal',14),
  ('background','細雨','寧靜細雨夜',NULL,0,true,true,'rain',15),
  ('background','星空 3D','Three.js 粒子星空',NULL,0,true,true,'stars',16),
  ('background','幾何 3D','Three.js 幾何體',NULL,0,true,true,'geo',17),
  ('background','霓虹波 3D','Three.js 霓虹波浪',NULL,0,true,true,'wave',18),
  ('background','雪花 3D','Three.js 雪花粒子',NULL,0,true,true,'snow',19),
  ('theme','預設','深空預設主題',NULL,0,true,true,'default',1),
  ('theme','深夜','深夜星空主題',NULL,0,true,true,'midnight',2),
  ('theme','極光','炫彩極光主題',NULL,0,true,true,'aurora',3),
  ('theme','玫瑰','浪漫玫瑰主題',NULL,0,true,true,'rose',4),
  ('theme','森林','清新森林主題',NULL,0,true,true,'forest',5),
  ('theme','琥珀','溫暖琥珀主題',NULL,0,true,true,'amber',6),
  ('theme','霓虹','電子霓虹主題',NULL,0,true,true,'neon',7),
  ('theme','紫晶','神秘紫晶主題',NULL,0,true,true,'purple',8),
  ('theme','珊瑚','活力珊瑚主題',NULL,0,true,true,'coral',9),
  ('theme','石板','沉穩石板主題',NULL,0,true,true,'slate',10)
ON CONFLICT DO NOTHING;
