-- Missing Columns Migration Script untuk Production Database
-- Menambahkan kolom-kolom yang ada di development tapi belum ada di production

-- 1. Add missing columns to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS foto_profil_url TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS status_kustom VARCHAR(100);
ALTER TABLE members ADD COLUMN IF NOT EXISTS featured_badge_id INTEGER;

-- 2. Ensure user_usernames table exists (jika belum ada)
CREATE TABLE IF NOT EXISTS user_usernames (
  id SERIAL PRIMARY KEY,
  member_id INTEGER UNIQUE NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure member_emails table exists (jika belum ada)
CREATE TABLE IF NOT EXISTS member_emails (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, email)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_usernames_username ON user_usernames(username);
CREATE INDEX IF NOT EXISTS idx_user_usernames_member_id ON user_usernames(member_id);
CREATE INDEX IF NOT EXISTS idx_member_emails_email ON member_emails(email);
CREATE INDEX IF NOT EXISTS idx_member_emails_member_id ON member_emails(member_id);
CREATE INDEX IF NOT EXISTS idx_members_featured_badge ON members(featured_badge_id);

-- 5. Add foreign key constraint for featured_badge_id if badges table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges') THEN
        -- Check if constraint doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_members_featured_badge'
        ) THEN
            ALTER TABLE members 
            ADD CONSTRAINT fk_members_featured_badge 
            FOREIGN KEY (featured_badge_id) REFERENCES badges(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- 6. Verifikasi hasil migration
SELECT 
    'members' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'members' 
    AND column_name IN ('foto_profil_url', 'bio', 'status_kustom', 'featured_badge_id')
ORDER BY column_name;

SELECT 
    'user_usernames' as table_name,
    COUNT(*) as total_records
FROM user_usernames;

SELECT 
    'member_emails' as table_name,
    COUNT(*) as total_records
FROM member_emails;

-- 7. Check if all expected indexes exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('members', 'user_usernames', 'member_emails', 'user_privileges')
    AND indexname LIKE '%idx_%'
ORDER BY tablename, indexname;
