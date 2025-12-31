-- Migration: Fix user_privileges untuk support SSO
-- Menambahkan kolom member_id dan memindahkan relasi dari clerk_id ke member_id

-- Step 1: Tambah kolom member_id
ALTER TABLE user_privileges 
ADD COLUMN member_id INTEGER;

-- Step 2: Populate member_id dari clerk_id yang ada
UPDATE user_privileges up
SET member_id = m.id
FROM members m
WHERE up.clerk_id = m.clerk_id
AND up.clerk_id IS NOT NULL;

-- Step 3: Buat index untuk performa
CREATE INDEX idx_user_privileges_member_id ON user_privileges(member_id);

-- Step 4: Tambah foreign key constraint
ALTER TABLE user_privileges
ADD CONSTRAINT fk_user_privileges_member_id 
FOREIGN KEY (member_id) 
REFERENCES members(id) 
ON DELETE CASCADE;

-- NOTE: Jangan hapus clerk_id dulu untuk backward compatibility
-- Nanti bisa dihapus setelah semua user migrate ke SSO
