-- ================================================================
-- PRODUCTION MIGRATION SCRIPT - PHASE 2: CORE SYSTEM
-- ================================================================
-- Purpose: Create BerkomunitasPlus system and member enhancements (MEDIUM RISK)
-- Date: September 22, 2025
-- Estimated Duration: 10-15 minutes
-- Dependencies: Phase 1 must be completed successfully
-- ================================================================

BEGIN;

-- Enable detailed logging
\echo '🚀 Starting Phase 2: Core System Migration'
\echo 'Creating BerkomunitasPlus tables and member enhancements...'

-- ================================================================
-- 1. CREATE BC DRWSKINCARE PLUS VERIFIED TABLE (Core feature)
-- ================================================================

\echo '📋 Step 2.1: Creating bc_drwskincare_plus_verified table...'

CREATE TABLE IF NOT EXISTS bc_drwskincare_plus_verified (
    id SERIAL PRIMARY KEY,
    api_data_id TEXT REFERENCES bc_drwskincare_api(id) ON DELETE SET NULL,
    connection_id INTEGER REFERENCES bc_drwskincare_plus(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(255) NOT NULL,
    nomor_hp VARCHAR(20),
    alamat_lengkap TEXT,
    instagram_username VARCHAR(100),
    facebook_username VARCHAR(100),
    tiktok_username VARCHAR(100),
    youtube_username VARCHAR(100),
    provinsi VARCHAR(255),
    kabupaten VARCHAR(255),
    kecamatan VARCHAR(255),
    desa VARCHAR(255),
    kode_pos VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

\echo '✅ bc_drwskincare_plus_verified table created'

-- ================================================================
-- 2. ADD ALAMAT_DETAIL COLUMN (Critical for address functionality)
-- ================================================================

\echo '📋 Step 2.2: Adding alamat_detail column...'

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bc_drwskincare_plus_verified' AND column_name = 'alamat_detail'
    ) THEN
        ALTER TABLE bc_drwskincare_plus_verified ADD COLUMN alamat_detail TEXT;
        \echo '✅ alamat_detail column added';
    ELSE
        \echo '⚠️  alamat_detail column already exists';
    END IF;
END $$;

-- ================================================================
-- 3. CREATE INDEXES FOR BC_DRWSKINCARE_PLUS_VERIFIED (Performance)
-- ================================================================

\echo '📋 Step 2.3: Creating indexes for performance...'

-- Create unique index to ensure one record per connection
CREATE UNIQUE INDEX IF NOT EXISTS idx_bc_drwskincare_plus_verified_connection_id 
ON bc_drwskincare_plus_verified(connection_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bc_drwskincare_plus_verified_created_at 
ON bc_drwskincare_plus_verified(created_at);

CREATE INDEX IF NOT EXISTS idx_bc_drwskincare_plus_verified_api_data_id 
ON bc_drwskincare_plus_verified(api_data_id);

\echo '✅ BC verified table indexes created'

-- ================================================================
-- 4. ENHANCE MEMBERS TABLE (Member profile improvements)
-- ================================================================

\echo '📋 Step 2.4: Enhancing members table...'

-- Add foto_profil_url column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'foto_profil_url'
    ) THEN
        ALTER TABLE members ADD COLUMN foto_profil_url TEXT;
        \echo '✅ foto_profil_url column added';
    ELSE
        \echo '⚠️  foto_profil_url column already exists';
    END IF;
END $$;

-- Add bio column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'bio'
    ) THEN
        ALTER TABLE members ADD COLUMN bio TEXT;
        \echo '✅ bio column added';
    ELSE
        \echo '⚠️  bio column already exists';
    END IF;
END $$;

-- Add status_kustom column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'status_kustom'
    ) THEN
        ALTER TABLE members ADD COLUMN status_kustom VARCHAR(100);
        \echo '✅ status_kustom column added';
    ELSE
        \echo '⚠️  status_kustom column already exists';
    END IF;
END $$;

-- Add featured_badge_id column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'featured_badge_id'
    ) THEN
        ALTER TABLE members ADD COLUMN featured_badge_id INTEGER;
        \echo '✅ featured_badge_id column added';
    ELSE
        \echo '⚠️  featured_badge_id column already exists';
    END IF;
END $$;

-- ================================================================
-- 5. ADD TABLE COMMENTS (Documentation)
-- ================================================================

\echo '📋 Step 2.5: Adding documentation comments...'

COMMENT ON TABLE bc_drwskincare_plus_verified IS 
'Stores verified personal data that BerkomunitasPlus members can edit and manage. Connected to API data and connection status.';

COMMENT ON COLUMN bc_drwskincare_plus_verified.api_data_id IS 
'Reference to bc_drwskincare_api table - links to dynamic API data that changes frequently';

COMMENT ON COLUMN bc_drwskincare_plus_verified.connection_id IS 
'Reference to bc_drwskincare_plus table - shows connection status and relationship';

COMMENT ON COLUMN bc_drwskincare_plus_verified.alamat_detail IS 
'Detailed address information including street, RT/RW, house number, landmarks, etc.';

COMMENT ON COLUMN bc_drwskincare_plus_verified.alamat_lengkap IS 
'Complete address for shipping and verification purposes (editable)';

COMMENT ON COLUMN members.foto_profil_url IS 'Profile photo URL for member avatar';
COMMENT ON COLUMN members.bio IS 'Member biography/description text';
COMMENT ON COLUMN members.status_kustom IS 'Custom status message set by member';
COMMENT ON COLUMN members.featured_badge_id IS 'ID of badge to feature on member profile';

-- ================================================================
-- 6. CREATE FOREIGN KEY CONSTRAINTS (If needed)
-- ================================================================

\echo '📋 Step 2.6: Adding foreign key constraints...'

-- Add foreign key for featured_badge_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_members_featured_badge'
    ) THEN
        ALTER TABLE members 
        ADD CONSTRAINT fk_members_featured_badge 
        FOREIGN KEY (featured_badge_id) REFERENCES badges(id) ON DELETE SET NULL;
        \echo '✅ featured_badge foreign key constraint added';
    ELSE
        \echo '⚠️  featured_badge foreign key constraint already exists';
    END IF;
EXCEPTION
    WHEN others THEN
        \echo '⚠️  Could not add featured_badge foreign key constraint (may not be needed)';
END $$;

-- ================================================================
-- 7. VERIFICATION
-- ================================================================

\echo '🔍 Step 2.7: Verifying Phase 2 changes...'

-- Verify bc_drwskincare_plus_verified table exists
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'bc_drwskincare_plus_verified'
    ) INTO table_exists;
    
    IF table_exists THEN
        \echo '✅ bc_drwskincare_plus_verified table verified';
    ELSE
        RAISE EXCEPTION 'ERROR: bc_drwskincare_plus_verified table was not created';
    END IF;
END $$;

-- Verify alamat_detail column exists
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bc_drwskincare_plus_verified' 
        AND column_name = 'alamat_detail'
    ) INTO column_exists;
    
    IF column_exists THEN
        \echo '✅ alamat_detail column verified';
    ELSE
        RAISE EXCEPTION 'ERROR: alamat_detail column was not created';
    END IF;
END $$;

-- Show table structure summary
\echo '📊 bc_drwskincare_plus_verified table structure:'
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'bc_drwskincare_plus_verified'
ORDER BY ordinal_position;

-- Show summary
\echo '📊 Phase 2 Summary:'
\echo '- ✅ bc_drwskincare_plus_verified table: Created with all columns'
\echo '- ✅ alamat_detail column: Added for address functionality'
\echo '- ✅ Members enhancements: Added profile columns'
\echo '- ✅ Performance indexes: Created for BC table'
\echo '- ✅ Foreign keys: Added where applicable'
\echo '- ✅ Documentation: Comments added'

\echo '🎉 Phase 2 Migration Completed Successfully!'
\echo 'Ready for Phase 3: Advanced Features Migration'

COMMIT;

-- Log completion
\echo '⏰ Phase 2 completed at:' 
SELECT CURRENT_TIMESTAMP;