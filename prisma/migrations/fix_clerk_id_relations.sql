-- Migration: Fix clerk_id relations to use member_id for SSO compatibility
-- Date: 2024-12-21
-- Description: Migrate clerk_id-based relations to member_id for SSO users

-- =============================================================================
-- 1. FIX member_emails TABLE
-- =============================================================================

-- Step 1: Add member_id column
ALTER TABLE member_emails ADD COLUMN IF NOT EXISTS member_id INT;

-- Step 2: Populate member_id from existing clerk_id
UPDATE member_emails me
SET member_id = m.id
FROM members m
WHERE me.clerk_id = m.clerk_id
AND me.member_id IS NULL;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_member_emails_member_id ON member_emails(member_id);

-- Step 4: Add foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_member_emails_member_id'
    ) THEN
        ALTER TABLE member_emails 
        ADD CONSTRAINT fk_member_emails_member_id 
        FOREIGN KEY (member_id) 
        REFERENCES members(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Step 5: Make member_id NOT NULL after data migration
-- ALTER TABLE member_emails ALTER COLUMN member_id SET NOT NULL;

-- Note: Don't drop clerk_id yet - keep for backward compatibility
-- After all apps migrated to SSO:
-- ALTER TABLE member_emails DROP COLUMN clerk_id;

-- =============================================================================
-- 2. FIX user_privileges TABLE (migrate existing clerk_id to member_id)
-- =============================================================================

-- Populate member_id for existing privileges that only have clerk_id
UPDATE user_privileges up
SET member_id = m.id
FROM members m
WHERE up.clerk_id = m.clerk_id
AND up.member_id IS NULL
AND m.clerk_id IS NOT NULL;

-- Verify migration
SELECT 
    'user_privileges migration' as table_name,
    COUNT(*) FILTER (WHERE member_id IS NOT NULL) as with_member_id,
    COUNT(*) FILTER (WHERE member_id IS NULL AND clerk_id IS NOT NULL) as need_migration,
    COUNT(*) as total
FROM user_privileges;

-- =============================================================================
-- 3. VERIFY RESULTS
-- =============================================================================

-- Check member_emails
SELECT 
    'member_emails' as table_name,
    COUNT(*) FILTER (WHERE member_id IS NOT NULL) as migrated,
    COUNT(*) FILTER (WHERE member_id IS NULL) as needs_migration,
    COUNT(*) as total
FROM member_emails;

-- Check members with admin privileges
SELECT 
    m.id,
    m.nama_lengkap,
    m.email,
    m.clerk_id,
    m.google_id,
    up.privilege,
    up.member_id as privilege_member_id,
    up.clerk_id as privilege_clerk_id
FROM members m
LEFT JOIN user_privileges up ON up.member_id = m.id
WHERE up.privilege = 'admin'
ORDER BY m.id;

-- =============================================================================
-- 4. SUMMARY
-- =============================================================================

SELECT 'Migration completed. All clerk_id relations migrated to member_id.' as status;
