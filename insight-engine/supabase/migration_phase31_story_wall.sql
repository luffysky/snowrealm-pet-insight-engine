-- Phase 31: Story Wall
-- Add is_pinned column to responses for story wall management

ALTER TABLE responses ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Partial index for fast story wall queries
CREATE INDEX IF NOT EXISTS idx_responses_story_wall
  ON responses (survey_id, allow_story_wall, status)
  WHERE allow_story_wall = true AND status = 'completed';
