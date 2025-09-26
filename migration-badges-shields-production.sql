-- =====================================================
-- PRODUCTION MIGRATION: Badge Shields.io Customization
-- Date: September 13, 2025
-- Description: Add customization fields for Shields.io badge system
-- =====================================================

-- Check if columns already exist before adding them
DO $$ 
BEGIN 
    -- Add badge_color column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'badges' AND column_name = 'badge_color'
    ) THEN
        ALTER TABLE badges ADD COLUMN badge_color VARCHAR(50) DEFAULT 'blue';
        RAISE NOTICE 'Added badge_color column to badges table';
    ELSE
        RAISE NOTICE 'badge_color column already exists in badges table';
    END IF;

    -- Add badge_style column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'badges' AND column_name = 'badge_style'
    ) THEN
        ALTER TABLE badges ADD COLUMN badge_style VARCHAR(50) DEFAULT 'flat';
        RAISE NOTICE 'Added badge_style column to badges table';
    ELSE
        RAISE NOTICE 'badge_style column already exists in badges table';
    END IF;

    -- Add badge_message column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'badges' AND column_name = 'badge_message'
    ) THEN
        ALTER TABLE badges ADD COLUMN badge_message VARCHAR(100) DEFAULT 'Achievement';
        RAISE NOTICE 'Added badge_message column to badges table';
    ELSE
        RAISE NOTICE 'badge_message column already exists in badges table';
    END IF;
END $$;

-- Update existing badges with default values (only if the columns are empty/null)
UPDATE badges 
SET 
    badge_color = COALESCE(badge_color, 'blue'),
    badge_style = COALESCE(badge_style, 'flat'),
    badge_message = COALESCE(badge_message, 'Achievement')
WHERE 
    badge_color IS NULL 
    OR badge_style IS NULL 
    OR badge_message IS NULL;

-- Set some example customizations for existing badges (optional)
-- You can customize these based on your badge types

-- Update specific badges with custom colors and messages
UPDATE badges SET badge_color = 'brightgreen', badge_message = 'First Steps' 
WHERE badge_name = 'Poin Perdana' AND badge_color = 'blue';

UPDATE badges SET badge_color = 'orange', badge_message = 'Active' 
WHERE badge_name = 'Aktif Berpartisipasi' AND badge_color = 'blue';

UPDATE badges SET badge_color = 'red', badge_message = 'Loyal' 
WHERE badge_name = 'Member Setia' AND badge_color = 'blue';

UPDATE badges SET badge_color = 'purple', badge_message = 'Social' 
WHERE badge_name LIKE '%Sosial%' AND badge_color = 'blue';

UPDATE badges SET badge_color = 'yellow', badge_message = 'Special' 
WHERE badge_name LIKE '%Khusus%' AND badge_color = 'blue';

-- Create indexes for performance (optional but recommended)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_badges_color_style 
ON badges(badge_color, badge_style);

-- Show final results
SELECT 
    id,
    badge_name,
    badge_color,
    badge_style,
    badge_message,
    created_at
FROM badges 
ORDER BY id;

RAISE NOTICE '✅ Badge Shields.io customization migration completed successfully!';
