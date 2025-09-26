-- SQL untuk cek apakah trigger dan function loyalty point sudah ada di database
-- Jalankan script ini di PostgreSQL untuk mengecek status trigger

-- 1. CEK APAKAH TRIGGER sync_coin_with_loyalty ADA
SELECT 
    t.trigger_name,
    t.table_name,
    t.action_timing,
    t.event_manipulation,
    p.proname as function_name
FROM information_schema.triggers t
LEFT JOIN pg_proc p ON p.oid = (
    SELECT proname::regproc::oid 
    FROM pg_proc 
    WHERE proname = regexp_replace(t.action_statement, '.*EXECUTE (?:PROCEDURE|FUNCTION)\s+(\w+).*', '\1')
)
WHERE t.table_name = 'loyalty_point_history'
  AND t.trigger_name LIKE '%sync%'
ORDER BY t.trigger_name;

-- 2. CEK SEMUA TRIGGER DI TABLE loyalty_point_history
SELECT 
    trigger_name,
    table_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE table_name = 'loyalty_point_history'
ORDER BY trigger_name;

-- 3. CEK SEMUA TRIGGER DI TABLE members
SELECT 
    trigger_name,
    table_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE table_name = 'members'
ORDER BY trigger_name;

-- 4. CEK FUNCTION sync_coin_with_loyalty ADA ATAU TIDAK
SELECT 
    p.proname as function_name,
    p.prorettype::regtype as return_type,
    pg_get_function_result(p.oid) as result_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
WHERE p.proname LIKE '%sync%coin%' 
   OR p.proname LIKE '%loyalty%'
   OR p.proname LIKE '%coin%'
ORDER BY p.proname;

-- 5. CEK APAKAH ADA TABLE coin_loyalty_audit_log
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'coin_loyalty_audit_log'
ORDER BY ordinal_position;

-- 6. TEST KONSISTENSI: CEK MEMBER YANG coin != loyalty_point
SELECT 
    id,
    nama_lengkap,
    loyalty_point,
    coin,
    (loyalty_point - coin) as difference
FROM members 
WHERE loyalty_point != coin 
ORDER BY ABS(loyalty_point - coin) DESC
LIMIT 10;

-- 7. CEK RECENT loyalty_point_history untuk melihat pola
SELECT 
    lph.id,
    lph.member_id,
    m.nama_lengkap,
    lph.event,
    lph.point,
    lph.created_at,
    lph.task_id
FROM loyalty_point_history lph
JOIN members m ON lph.member_id = m.id
ORDER BY lph.created_at DESC
LIMIT 10;
