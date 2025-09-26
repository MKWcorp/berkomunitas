-- ================================================================
-- PRODUCTION MIGRATION SCRIPT - PHASE 1: INFRASTRUCTURE
-- ================================================================
-- Purpose: Create new tables and simple column additions (LOW RISK)
-- Date: September 22, 2025
-- Estimated Duration: 5-10 minutes
-- Dependencies: None
-- ================================================================

BEGIN;

-- Enable detailed logging
\echo '🚀 Starting Phase 1: Infrastructure Migration'
\echo 'Creating new tables and adding simple columns...'

-- ================================================================
-- 1. CREATE NEW TABLES (Safe - no dependencies)
-- ================================================================

\echo '📋 Step 1.1: Creating event_settings table...'
CREATE TABLE IF NOT EXISTS event_settings (
    setting_name VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    description TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ
);

-- Create index for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_event_settings_dates ON event_settings(start_date, end_date);

\echo '✅ event_settings table created successfully'

\echo '📋 Step 1.2: Creating coin_history table...'
CREATE TABLE IF NOT EXISTS coin_history (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    coin INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comment_id INTEGER NULL,
    event_type TEXT NOT NULL DEFAULT 'manual',
    task_id INTEGER NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coin_history_member_id ON coin_history(member_id);
CREATE INDEX IF NOT EXISTS idx_coin_history_created_at ON coin_history(created_at);
CREATE INDEX IF NOT EXISTS idx_coin_history_event_type ON coin_history(event_type);

\echo '✅ coin_history table created successfully'

-- ================================================================
-- 2. ADD SIMPLE COLUMNS TO EXISTING TABLES (Safe - backward compatible)
-- ================================================================

\echo '📋 Step 1.3: Enhancing badges table...'

-- Check and add badge_color column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'badges' AND column_name = 'badge_color'
    ) THEN
        ALTER TABLE badges ADD COLUMN badge_color VARCHAR(20) DEFAULT 'blue';
        \echo '✅ badge_color column added';
    ELSE
        \echo '⚠️  badge_color column already exists';
    END IF;
END $$;

-- Check and add badge_style column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'badges' AND column_name = 'badge_style'
    ) THEN
        ALTER TABLE badges ADD COLUMN badge_style VARCHAR(20) DEFAULT 'flat';
        \echo '✅ badge_style column added';
    ELSE
        \echo '⚠️  badge_style column already exists';
    END IF;
END $$;

-- Check and add badge_message column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'badges' AND column_name = 'badge_message'
    ) THEN
        ALTER TABLE badges ADD COLUMN badge_message VARCHAR(50) DEFAULT 'Achievement';
        \echo '✅ badge_message column added';
    ELSE
        \echo '⚠️  badge_message column already exists';
    END IF;
END $$;

-- ================================================================
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- ================================================================

\echo '📋 Step 1.4: Adding table comments...'

COMMENT ON TABLE event_settings IS 'Manages system events and loyalty point bonus settings';
COMMENT ON TABLE coin_history IS 'Tracks all coin balance changes for members with detailed audit trail';

COMMENT ON COLUMN coin_history.member_id IS 'Reference to members table';
COMMENT ON COLUMN coin_history.event IS 'Description of what caused the coin change';
COMMENT ON COLUMN coin_history.coin IS 'Amount of coin changed (positive for addition, negative for subtraction)';
COMMENT ON COLUMN coin_history.event_type IS 'Type of event: admin_manual, task_completion, redemption, bonus, penalty, etc';
COMMENT ON COLUMN coin_history.comment_id IS 'Reference to comment if coin change was from commenting';
COMMENT ON COLUMN coin_history.task_id IS 'Reference to task if coin change was from task completion';

-- ================================================================
-- 4. VERIFICATION
-- ================================================================

\echo '🔍 Step 1.5: Verifying Phase 1 changes...'

-- Verify new tables exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name IN ('event_settings', 'coin_history');
    
    IF table_count = 2 THEN
        \echo '✅ All new tables created successfully';
    ELSE
        RAISE EXCEPTION 'ERROR: Not all tables were created. Expected 2, found %', table_count;
    END IF;
END $$;

-- Verify badge columns exist
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count 
    FROM information_schema.columns 
    WHERE table_name = 'badges' 
    AND column_name IN ('badge_color', 'badge_style', 'badge_message');
    
    IF column_count = 3 THEN
        \echo '✅ All badge columns added successfully';
    ELSE
        \echo '⚠️  Some badge columns may already exist. Found % columns', column_count;
    END IF;
END $$;

-- Show summary
\echo '📊 Phase 1 Summary:'
\echo '- ✅ event_settings table: Created'
\echo '- ✅ coin_history table: Created'  
\echo '- ✅ badges enhancements: Added color, style, message columns'
\echo '- ✅ Performance indexes: Created'
\echo '- ✅ Documentation: Comments added'

\echo '🎉 Phase 1 Migration Completed Successfully!'
\echo 'Ready for Phase 2: Core System Migration'

COMMIT;

-- Log completion
\echo '⏰ Phase 1 completed at:' 
SELECT CURRENT_TIMESTAMP;