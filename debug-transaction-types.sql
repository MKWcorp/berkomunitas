-- Script untuk debug dan perbaiki masalah transaction_type_id
-- Jalankan di database untuk memastikan data dan trigger bekerja dengan benar

-- 1. Cek apakah transaction_types sudah ada
SELECT * FROM transaction_types ORDER BY id;

-- 2. Cek trigger yang ada
SELECT 
    schemaname,
    tablename,
    triggername,
    triggerdef
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'loyalty_point_history'
AND n.nspname = 'public';

-- 3. Test query yang digunakan di trigger
SELECT id, type_code 
FROM transaction_types 
WHERE type_code = 'admin_manual';

-- 4. Cek apakah ada record di loyalty_point_history dengan event_type = 'admin_manual'
SELECT * FROM loyalty_point_history 
WHERE event_type = 'admin_manual' 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Jika perlu, tambah transaction type yang missing
INSERT INTO transaction_types (type_code, name, affects_loyalty, affects_coin, is_credit) 
VALUES ('admin_manual', 'Manual Admin Adjustment', true, true, true)
ON CONFLICT (type_code) DO NOTHING;
