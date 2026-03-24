-- Phase 30: Story Card System
-- Add story wall opt-in and card generation tracking to responses

ALTER TABLE responses ADD COLUMN IF NOT EXISTS allow_story_wall BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS story_card_generated BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_responses_story_wall ON responses (allow_story_wall) WHERE allow_story_wall = true;
