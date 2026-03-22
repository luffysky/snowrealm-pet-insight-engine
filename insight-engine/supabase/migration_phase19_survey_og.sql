-- Migration Phase 19: Survey Specific OG Meta
ALTER TABLE surveys 
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image_url TEXT;
