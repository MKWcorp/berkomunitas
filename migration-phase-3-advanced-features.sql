-- ================================================================
-- PRODUCTION MIGRATION SCRIPT - PHASE 3: ADVANCED FEATURES  
-- ================================================================
-- Purpose: Add coin/loyalty system and performance optimizations (HIGH RISK)
-- Date: September 22, 2025
-- Estimated Duration: 15-20 minutes
-- Dependencies: Phase 1 and Phase 2 must be completed successfully
-- ================================================================

BEGIN;

-- Enable detailed logging
\echo '🚀 Starting Phase 3: Advanced Features Migration'
\echo 'Adding coin/loyalty system and performance optimizations...'

-- ================================================================
-- 1. ADD COIN AND LOYALTY SYSTEM TO MEMBERS TABLE (Critical feature)
-- ================================================================

\echo '📋 Step 3.1: Adding coin and loyalty system columns...'

-- Add coin column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'coin'
    ) THEN
        ALTER TABLE members ADD COLUMN coin INTEGER DEFAULT 0 NOT NULL;
        \echo '✅ coin column added to members table';
    ELSE
        \echo '⚠️  coin column already exists in members table';
    END IF;
END $$;

-- Add loyalty_point column  
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'loyalty_point'
    ) THEN
        ALTER TABLE members ADD COLUMN loyalty_point INTEGER DEFAULT 0 NOT NULL;
        \echo '✅ loyalty_point column added to members table';
    ELSE
        \echo '⚠️  loyalty_point column already exists in members table';
    END IF;
END $$;

-- ================================================================
-- 2. CREATE PERFORMANCE INDEXES FOR COIN/LOYALTY SYSTEM
-- ================================================================

\echo '📋 Step 3.2: Creating performance indexes...'

-- Create index for coin column (for leaderboards, etc.)
CREATE INDEX IF NOT EXISTS idx_members_coin ON members(coin DESC);

-- Create index for loyalty_point column (for loyalty calculations)
CREATE INDEX IF NOT EXISTS idx_members_loyalty_point ON members(loyalty_point DESC);

-- Create index for featured_badge_id (for profile queries)
CREATE INDEX IF NOT EXISTS idx_members_featured_badge ON members(featured_badge_id);

-- Create composite index for active members with coins
CREATE INDEX IF NOT EXISTS idx_members_active_coins ON members(coin DESC, created_at DESC) 
WHERE coin > 0;

-- Create composite index for active members with loyalty points
CREATE INDEX IF NOT EXISTS idx_members_active_loyalty ON members(loyalty_point DESC, created_at DESC) 
WHERE loyalty_point > 0;

\echo '✅ Performance indexes created for coin/loyalty system'

-- ================================================================
-- 3. CREATE ADDITIONAL SUPPORTING TABLES (If needed)
-- ================================================================

\echo '📋 Step 3.3: Creating additional supporting tables...'

-- Create user_usernames table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_usernames (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create member_emails table if it doesn't exist
CREATE TABLE IF NOT EXISTS member_emails (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

\echo '✅ Additional supporting tables created'

-- ================================================================
-- 4. CREATE INDEXES FOR SUPPORTING TABLES
-- ================================================================

\echo '📋 Step 3.4: Creating indexes for supporting tables...'

-- Indexes for user_usernames
CREATE INDEX IF NOT EXISTS idx_user_usernames_username ON user_usernames(username);
CREATE INDEX IF NOT EXISTS idx_user_usernames_member_id ON user_usernames(member_id);
CREATE INDEX IF NOT EXISTS idx_user_usernames_active ON user_usernames(is_active);

-- Indexes for member_emails  
CREATE INDEX IF NOT EXISTS idx_member_emails_email ON member_emails(email);
CREATE INDEX IF NOT EXISTS idx_member_emails_member_id ON member_emails(member_id);
CREATE INDEX IF NOT EXISTS idx_member_emails_primary ON member_emails(is_primary) WHERE is_primary = true;

\echo '✅ Supporting table indexes created'

-- ================================================================
-- 5. UPDATE EXISTING DATA (Initialize coin/loyalty values)
-- ================================================================

\echo '📋 Step 3.5: Initializing coin and loyalty point values...'

-- Update existing members to have 0 coins and loyalty points if NULL
UPDATE members 
SET coin = 0 
WHERE coin IS NULL;

UPDATE members 
SET loyalty_point = 0 
WHERE loyalty_point IS NULL;

-- Get count of updated members
DO $$
DECLARE
    member_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO member_count FROM members;
    \echo 'Initialized coin/loyalty values for ' || member_count || ' members';
END $$;

-- ================================================================
-- 6. ADD CONSTRAINTS AND VALIDATION
-- ================================================================

\echo '📋 Step 3.6: Adding data constraints and validation...'

-- Add check constraints to ensure coin and loyalty_point are non-negative
DO $$
BEGIN
    -- Add coin check constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_members_coin_non_negative'
    ) THEN
        ALTER TABLE members ADD CONSTRAINT chk_members_coin_non_negative 
        CHECK (coin >= 0);
        \echo '✅ Coin non-negative constraint added';
    ELSE
        \echo '⚠️  Coin non-negative constraint already exists';
    END IF;
    
    -- Add loyalty_point check constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_members_loyalty_non_negative'
    ) THEN
        ALTER TABLE members ADD CONSTRAINT chk_members_loyalty_non_negative 
        CHECK (loyalty_point >= 0);
        \echo '✅ Loyalty point non-negative constraint added';
    ELSE
        \echo '⚠️  Loyalty point non-negative constraint already exists';
    END IF;
END $$;

-- ================================================================
-- 7. ADD DOCUMENTATION COMMENTS
-- ================================================================

\echo '📋 Step 3.7: Adding documentation comments...'

COMMENT ON COLUMN members.coin IS 'Member coin balance for rewards and activities';
COMMENT ON COLUMN members.loyalty_point IS 'Member loyalty points for tier benefits and bonuses';

COMMENT ON TABLE user_usernames IS 'Stores member usernames with history and activity status';
COMMENT ON TABLE member_emails IS 'Manages member email addresses with verification status';

COMMENT ON COLUMN user_usernames.is_active IS 'Whether this username is currently active for the member';
COMMENT ON COLUMN member_emails.is_primary IS 'Whether this is the primary email address for the member';
COMMENT ON COLUMN member_emails.is_verified IS 'Whether this email address has been verified';

-- ================================================================
-- 8. VERIFICATION AND TESTING
-- ================================================================

\echo '🔍 Step 3.8: Verifying Phase 3 changes...'

-- Verify coin and loyalty_point columns exist
DO $$
DECLARE
    coin_exists BOOLEAN;
    loyalty_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'coin'
    ) INTO coin_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'loyalty_point'  
    ) INTO loyalty_exists;
    
    IF coin_exists AND loyalty_exists THEN
        \echo '✅ Coin and loyalty point columns verified';
    ELSE
        RAISE EXCEPTION 'ERROR: Coin or loyalty point columns missing';
    END IF;
END $$;

-- Verify indexes exist
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE tablename = 'members' 
    AND indexname IN ('idx_members_coin', 'idx_members_loyalty_point', 'idx_members_featured_badge');
    
    IF index_count >= 3 THEN
        \echo '✅ Member table indexes verified';
    ELSE
        \echo '⚠️  Some member indexes may be missing. Found ' || index_count || ' indexes';
    END IF;
END $$;

-- Show coin/loyalty statistics
\echo '📊 Current coin/loyalty statistics:'
SELECT 
    COUNT(*) as total_members,
    SUM(coin) as total_coins,
    SUM(loyalty_point) as total_loyalty_points,
    AVG(coin) as avg_coins_per_member,
    AVG(loyalty_point) as avg_loyalty_per_member,
    MAX(coin) as max_coins,
    MAX(loyalty_point) as max_loyalty_points
FROM members;

-- Show summary
\echo '📊 Phase 3 Summary:'
\echo '- ✅ Coin system: Added coin column with constraints'
\echo '- ✅ Loyalty system: Added loyalty_point column with constraints'  
\echo '- ✅ Performance indexes: Created for leaderboards and queries'
\echo '- ✅ Supporting tables: user_usernames, member_emails created'
\echo '- ✅ Data validation: Non-negative constraints added'
\echo '- ✅ Data initialization: All existing members updated'
\echo '- ✅ Documentation: Comments added'

\echo '🎉 Phase 3 Migration Completed Successfully!'
\echo '⚠️  Ready for Phase 4: Data Cleanup & Optimization (FINAL PHASE)'

COMMIT;

-- Log completion
\echo '⏰ Phase 3 completed at:' 
SELECT CURRENT_TIMESTAMP;