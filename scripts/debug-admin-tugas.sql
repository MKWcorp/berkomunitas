-- Check Admin Tugas List Issues
-- Run this to debug why task list is not showing

-- 1. Check if tugas table has data
SELECT 
    COUNT(*) as total_tugas,
    COUNT(CASE WHEN status = 'tersedia' THEN 1 END) as tersedia,
    COUNT(CASE WHEN status = 'tidak_tersedia' THEN 1 END) as tidak_tersedia,
    COUNT(CASE WHEN status = 'selesai' THEN 1 END) as selesai
FROM tugas;

-- 2. Check recent tasks
SELECT 
    id,
    keyword_tugas,
    status,
    point_value,
    post_timestamp
FROM tugas
ORDER BY post_timestamp DESC
LIMIT 10;

-- 3. Check user_privileges for admin users
SELECT 
    up.id,
    up.member_id,
    m.nama_lengkap,
    m.email,
    up.privilege,
    up.is_active,
    up.expires_at,
    up.granted_at
FROM user_privileges up
JOIN members m ON m.id = up.member_id
WHERE up.privilege = 'admin'
  AND up.is_active = true
ORDER BY up.granted_at DESC;

-- 4. Check if there are any members
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN google_id IS NOT NULL THEN 1 END) as with_google_id,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email
FROM members;

-- 5. Check recent API logs (if you have logs table)
-- SELECT * FROM api_logs WHERE endpoint LIKE '%admin/tugas%' ORDER BY created_at DESC LIMIT 10;
