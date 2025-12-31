-- Quick check admin access for current user
-- Replace 'your-email@gmail.com' with your actual email

-- 1. Check your member record
SELECT 
    id as member_id,
    nama_lengkap,
    email,
    google_id,
    created_at
FROM members 
WHERE email = 'your-email@gmail.com';  -- REPLACE THIS!

-- 2. Check if you have admin privilege
SELECT 
    up.id,
    up.member_id,
    up.privilege,
    up.is_active,
    up.expires_at,
    up.granted_at,
    m.email,
    m.nama_lengkap
FROM user_privileges up
JOIN members m ON m.id = up.member_id
WHERE m.email = 'your-email@gmail.com'  -- REPLACE THIS!
  AND up.privilege = 'admin';

-- 3. If no admin privilege found, grant it:
-- (Run this ONLY if query #2 returns no results)
/*
INSERT INTO user_privileges (member_id, privilege, is_active, granted_at)
SELECT 
    id,
    'admin',
    true,
    NOW()
FROM members
WHERE email = 'your-email@gmail.com'  -- REPLACE THIS!
  AND NOT EXISTS (
    SELECT 1 FROM user_privileges 
    WHERE member_id = members.id AND privilege = 'admin'
  );
*/

-- 4. Check total tugas in database
SELECT 
    COUNT(*) as total_tugas,
    COUNT(CASE WHEN status = 'tersedia' THEN 1 END) as tersedia,
    COUNT(CASE WHEN status = 'tidak_tersedia' THEN 1 END) as tidak_tersedia
FROM tugas_ai;

-- 5. Check recent tugas (to see if there's actual data)
SELECT 
    id,
    keyword_tugas,
    status,
    point_value,
    post_timestamp
FROM tugas_ai
ORDER BY post_timestamp DESC
LIMIT 10;
