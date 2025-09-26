-- =====================================================
-- SAFE PRODUCTION MIGRATION: Add Badge Customization Columns
-- Date: September 13, 2025
-- Description: Safely add badge_color, badge_style, badge_message to badges table
-- This script ONLY adds new columns and preserves existing data
-- =====================================================

-- Start transaction for safety
BEGIN;

-- Add badge_color column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'badges' 
        AND column_name = 'badge_color'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE badges ADD COLUMN badge_color VARCHAR(20) DEFAULT 'blue';
        RAISE NOTICE '✅ Added badge_color column to badges table';
    ELSE
        RAISE NOTICE '⚠️  badge_color column already exists in badges table';
    END IF;
END $$;

-- Add badge_style column if it doesn't exist  
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'badges' 
        AND column_name = 'badge_style'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE badges ADD COLUMN badge_style VARCHAR(20) DEFAULT 'flat';
        RAISE NOTICE '✅ Added badge_style column to badges table';
    ELSE
        RAISE NOTICE '⚠️  badge_style column already exists in badges table';
    END IF;
END $$;

-- Add badge_message column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'badges' 
        AND column_name = 'badge_message'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE badges ADD COLUMN badge_message VARCHAR(50) DEFAULT 'Achievement';
        RAISE NOTICE '✅ Added badge_message column to badges table';
    ELSE
        RAISE NOTICE '⚠️  badge_message column already exists in badges table';
    END IF;
END $$;

-- Update existing NULL values with defaults (safety measure)
UPDATE badges 
SET 
    badge_color = COALESCE(badge_color, 'blue'),
    badge_style = COALESCE(badge_style, 'flat'),
    badge_message = COALESCE(badge_message, 'Achievement')
WHERE 
    badge_color IS NULL 
    OR badge_style IS NULL 
    OR badge_message IS NULL;

-- Verify the changes
DO $$
DECLARE
    badge_count INTEGER;
    color_count INTEGER;
    style_count INTEGER;
    message_count INTEGER;
BEGIN
    -- Count total badges
    SELECT COUNT(*) INTO badge_count FROM badges;
    
    -- Count badges with customization values
    SELECT COUNT(*) INTO color_count FROM badges WHERE badge_color IS NOT NULL;
    SELECT COUNT(*) INTO style_count FROM badges WHERE badge_style IS NOT NULL;  
    SELECT COUNT(*) INTO message_count FROM badges WHERE badge_message IS NOT NULL;
    
    RAISE NOTICE '📊 VERIFICATION RESULTS:';
    RAISE NOTICE '   Total badges: %', badge_count;
    RAISE NOTICE '   Badges with colors: %', color_count;
    RAISE NOTICE '   Badges with styles: %', style_count;
    RAISE NOTICE '   Badges with messages: %', message_count;
    
    IF badge_count = color_count AND badge_count = style_count AND badge_count = message_count THEN
        RAISE NOTICE '✅ All badges have customization fields!';
    ELSE
        RAISE NOTICE '⚠️  Some badges missing customization fields';
    END IF;
END $$;

-- Show sample data after migration
SELECT 
    id,
    badge_name,
    badge_color,
    badge_style,
    badge_message,
    description
FROM badges 
ORDER BY id 
LIMIT 5;

-- Commit transaction
COMMIT;

RAISE NOTICE '🎉 MIGRATION COMPLETED SUCCESSFULLY!';
RAISE NOTICE '📝 Next steps:';
RAISE NOTICE '   1. Deploy application code to production';
RAISE NOTICE '   2. Test badge customization in admin panel';
RAISE NOTICE '   3. Verify badge display in profile pages';

-- Show final schema info
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'badges' 
    AND table_schema = 'public'
    AND column_name IN ('badge_color', 'badge_style', 'badge_message')
ORDER BY column_name;
