-- Test untuk user wiro@drwcorp.com
-- Run this in your database client

-- 1. Check your member record
SELECT 
    id as member_id,
    nama_lengkap,
    email,
    google_id,
    created_at
FROM members 
WHERE email = 'wiro@drwcorp.com';

-- 2. Check your admin privilege
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
WHERE m.email = 'wiro@drwcorp.com'
  AND up.privilege = 'admin';

-- 3. Check total tugas in database
SELECT 
    COUNT(*) as total_tugas,
    COUNT(CASE WHEN status = 'tersedia' THEN 1 END) as tersedia,
    COUNT(CASE WHEN status = 'tidak_tersedia' THEN 1 END) as tidak_tersedia,
    COUNT(CASE WHEN status = 'selesai' THEN 1 END) as selesai
FROM tugas_ai;

-- 4. Show recent 5 tugas
SELECT 
    id,
    keyword_tugas,
    status,
    point_value,
    post_timestamp,
    created_at
FROM tugas_ai
ORDER BY post_timestamp DESC
LIMIT 5;

-- 5. Check if any errors in task_submissions
SELECT COUNT(*) as total_submissions
FROM task_submissions;
