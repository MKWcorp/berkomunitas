-- Script untuk memperbaiki inkonsistensi coin vs loyalty_point
-- Menyelaraskan coin dengan loyalty_point untuk semua member

-- 1. Backup data sebelum perubahan (optional, untuk safety)
-- CREATE TABLE members_backup AS SELECT * FROM members;

-- 2. Sinkronkan coin dengan loyalty_point untuk semua member
UPDATE members 
SET coin = loyalty_point 
WHERE coin != loyalty_point;

-- 3. Tampilkan hasil perubahan
SELECT 
  id,
  nama_lengkap,
  loyalty_point,
  coin,
  CASE 
    WHEN loyalty_point = coin THEN 'SYNCED ✅'
    ELSE 'MISMATCH ❌'
  END as status
FROM members 
ORDER BY id;

-- 4. Statistik summary
SELECT 
  COUNT(*) as total_members,
  SUM(CASE WHEN loyalty_point = coin THEN 1 ELSE 0 END) as synced_members,
  SUM(CASE WHEN loyalty_point != coin THEN 1 ELSE 0 END) as mismatched_members
FROM members;
