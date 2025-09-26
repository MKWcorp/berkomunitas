-- Migration: Add badge_color and badge_style fields to badges table
-- Replace icon_name field with new Shields.io badge system

-- Add new columns for Shields.io badge customization
ALTER TABLE badges ADD COLUMN badge_color VARCHAR(20) DEFAULT 'blue';
ALTER TABLE badges ADD COLUMN badge_style VARCHAR(20) DEFAULT 'flat';

-- Update existing badges with default values
UPDATE badges SET 
  badge_color = 'blue',
  badge_style = 'flat'
WHERE badge_color IS NULL OR badge_style IS NULL;

-- Optional: Remove old icon_name column (uncomment if you want to drop it)
-- ALTER TABLE badges DROP COLUMN icon_name;

-- Indexes for performance (optional)
CREATE INDEX IF NOT EXISTS idx_badges_color ON badges(badge_color);
CREATE INDEX IF NOT EXISTS idx_badges_style ON badges(badge_style);
