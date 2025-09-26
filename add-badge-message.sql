-- Add badge_message column to badges table with default value
ALTER TABLE badges 
ADD COLUMN IF NOT EXISTS badge_message VARCHAR(50) DEFAULT 'Achievement';

-- Update existing badges to have Achievement message
UPDATE badges 
SET badge_message = 'Achievement' 
WHERE badge_message IS NULL;

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'badges' 
ORDER BY ordinal_position;
