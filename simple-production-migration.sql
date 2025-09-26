-- =====================================================
-- SIMPLE PRODUCTION MIGRATION: Add Badge Customization Columns
-- Date: September 13, 2025
-- Description: Simple version without RAISE NOTICE for compatibility
-- =====================================================

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

-- Verify migration worked - show new columns
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

-- Show sample data
SELECT 
    id,
    badge_name,
    badge_color,
    badge_style,
    badge_message
FROM badges 
ORDER BY id 
LIMIT 3;
