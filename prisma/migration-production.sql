-- Migration script untuk perubahan dari user_email ke clerk_id
-- Jalankan script ini di database produksi setelah deploy

-- 1. Backup tabel user_privileges yang ada
CREATE TABLE user_privileges_backup AS SELECT * FROM user_privileges;

-- 2. Tambah kolom clerk_id ke tabel user_privileges (jika belum ada)
ALTER TABLE user_privileges ADD COLUMN clerk_id VARCHAR(255);

-- 3. Update data user_privileges dengan clerk_id dari tabel members
UPDATE user_privileges 
SET clerk_id = (
  SELECT m.clerk_id 
  FROM members m 
  WHERE m.email = user_privileges.user_email
)
WHERE user_email IS NOT NULL;

-- 4. Hapus records yang tidak bisa di-match (clerk_id NULL)
-- HATI-HATI: pastikan backup sudah dibuat sebelum menjalankan ini
-- DELETE FROM user_privileges WHERE clerk_id IS NULL;

-- 5. Buat index baru untuk clerk_id
CREATE INDEX idx_user_privileges_clerk_id ON user_privileges(clerk_id);
CREATE INDEX idx_user_privileges_privilege ON user_privileges(privilege);

-- 6. Buat unique constraint baru
ALTER TABLE user_privileges ADD CONSTRAINT unique_clerk_id_privilege UNIQUE (clerk_id, privilege);

-- 7. (OPSIONAL) Hapus kolom user_email setelah memastikan semua berjalan baik
-- ALTER TABLE user_privileges DROP COLUMN user_email;

-- 8. Update kolom clerkId menjadi clerk_id di tabel members (jika belum)
-- ALTER TABLE members RENAME COLUMN "clerkId" TO clerk_id;

-- Verifikasi hasil migrasi
SELECT COUNT(*) as total_privileges FROM user_privileges;
SELECT COUNT(*) as with_clerk_id FROM user_privileges WHERE clerk_id IS NOT NULL;
SELECT COUNT(*) as with_email FROM user_privileges WHERE user_email IS NOT NULL;
