-- Migration: Rename shipping_tracking to redemption_notes in reward_redemptions table
-- Date: 2025-09-17
-- Description: Rename column shipping_tracking to redemption_notes for better semantic meaning
-- This field will store admin notes about the redemption process

-- Step 1: Rename the column
ALTER TABLE reward_redemptions 
RENAME COLUMN shipping_tracking TO redemption_notes;

-- Step 2: Update any existing comments or documentation
COMMENT ON COLUMN reward_redemptions.redemption_notes IS 'Admin notes about the redemption process, previously used for shipping tracking';

-- Verification query (optional - run to verify the change)
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'reward_redemptions' 
-- AND column_name = 'redemption_notes';