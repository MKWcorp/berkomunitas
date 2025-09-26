-- =====================================================================
-- POST-DEPLOYMENT VALIDATION SCRIPT
-- =====================================================================
-- Run these queries after applying the loyalty trigger fix
-- to validate everything is working correctly
-- =====================================================================

-- 1. VERIFY TRIGGER EXISTS AND IS ACTIVE
SELECT 
    trigger_name,
    table_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE table_name = 'members' 
  AND trigger_name = 'trigger_validate_coin_loyalty_ratio';

-- Expected: Should show 1 row with trigger details

-- 2. VERIFY FUNCTION IS UPDATED
SELECT 
    proname as function_name,
    prokind as function_type,
    LENGTH(prosrc) as source_length
FROM pg_proc 
WHERE proname = 'validate_coin_not_exceed_loyalty';

-- Expected: Should show function with longer source_length (updated version)

-- 3. CHECK PROBLEM MEMBERS (coin > loyalty_point)
SELECT 
    id,
    nama_lengkap,
    loyalty_point,
    coin,
    (coin - loyalty_point) as coin_excess,
    CASE 
        WHEN coin > loyalty_point THEN 'PROBLEM'
        ELSE 'OK'
    END as status
FROM members 
WHERE coin > loyalty_point
ORDER BY (coin - loyalty_point) DESC
LIMIT 10;

-- Expected: Should show members with coin > loyalty_point (these are the ones that needed the fix)

-- 4. TEST ADMIN MANUAL LOYALTY UPDATE (DRY RUN)
BEGIN;
    -- Test increase
    UPDATE members SET loyalty_point = loyalty_point + 1000 WHERE id = 9;
    SELECT id, loyalty_point, coin FROM members WHERE id = 9;
    
    -- Test decrease  
    UPDATE members SET loyalty_point = loyalty_point - 1000 WHERE id = 9;
    SELECT id, loyalty_point, coin FROM members WHERE id = 9;
ROLLBACK;

-- Expected: Should complete without errors

-- 5. VERIFY COIN PROTECTION STILL WORKS
BEGIN;
    -- This should fail with trigger error
    UPDATE members SET coin = coin + 1000000 WHERE id = 9;
ROLLBACK;

-- Expected: Should fail with trigger validation error

-- 6. CHECK RECENT LOYALTY HISTORY
SELECT 
    lph.id,
    lph.member_id,
    m.nama_lengkap,
    lph.event,
    lph.point,
    lph.event_type,
    lph.created_at
FROM loyalty_point_history lph
JOIN members m ON m.id = lph.member_id
WHERE lph.created_at >= NOW() - INTERVAL '1 day'
ORDER BY lph.created_at DESC
LIMIT 20;

-- Expected: Should show recent loyalty point activities

-- 7. PERFORMANCE CHECK - ENSURE TRIGGER ISN'T TOO SLOW
EXPLAIN ANALYZE 
UPDATE members SET loyalty_point = loyalty_point + 0 WHERE id = 1;

-- Expected: Should execute quickly (< 10ms typically)

-- 8. CHECK DATABASE LOGS FOR ANY ERRORS
-- Note: This depends on your logging configuration
-- Look for any ERROR or WARNING messages related to triggers

-- 9. VALIDATE MEMBER STATISTICS
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN coin > loyalty_point THEN 1 END) as coin_exceeds_loyalty,
    COUNT(CASE WHEN coin = 0 AND loyalty_point = 0 THEN 1 END) as zero_balances,
    AVG(loyalty_point) as avg_loyalty,
    AVG(coin) as avg_coin,
    MAX(loyalty_point) as max_loyalty,
    MAX(coin) as max_coin
FROM members;

-- Expected: Reasonable distribution of values

-- 10. TEST SPECIFIC MEMBER OPERATIONS
-- Test on member ID 9 (the problem member from error logs)
SELECT 
    id,
    nama_lengkap,
    loyalty_point,
    coin,
    (coin - loyalty_point) as excess,
    created_at
FROM members 
WHERE id = 9;

-- =====================================================================
-- SUCCESS CRITERIA
-- =====================================================================
-- ✅ Trigger exists and is active
-- ✅ Function source is updated (longer length)
-- ✅ Admin manual loyalty updates work without errors
-- ✅ Coin validation still prevents excessive coin increases
-- ✅ No performance degradation
-- ✅ Database logs show no new errors
-- ✅ Member ID 9 can have loyalty_point updated despite coin excess

-- =====================================================================
-- TROUBLESHOOTING
-- =====================================================================
-- If any test fails, check:
-- 1. Was the fix SQL applied correctly?
-- 2. Are there any database connection issues?
-- 3. Are there any conflicting triggers or functions?
-- 4. Check PostgreSQL logs for detailed error messages

-- To check PostgreSQL logs:
-- SELECT * FROM pg_stat_activity WHERE state = 'active';
-- SHOW log_destination;
-- SHOW logging_collector;

-- =====================================================================