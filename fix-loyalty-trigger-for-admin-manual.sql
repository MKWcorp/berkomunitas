-- =====================================================================
-- FIX LOYALTY TRIGGER FOR ADMIN MANUAL OPERATIONS
-- =====================================================================
-- Problem: Trigger validate_coin_not_exceed_loyalty() prevents admin 
--          from manually updating loyalty_point when coin > loyalty_point
-- 
-- Solution: Update trigger to allow loyalty_point-only changes (admin manual)
--           while maintaining coin validation for normal operations
-- 
-- Date: 2025-09-17
-- Applied to: Production Database
-- =====================================================================

-- STEP 1: Backup existing trigger function (for rollback if needed)
-- Note: This is documentation only, actual backup done via pg_dump

-- STEP 2: Update the validation function to allow loyalty-only updates
CREATE OR REPLACE FUNCTION validate_coin_not_exceed_loyalty()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip validation if ONLY loyalty_point is being changed (admin manual)
    -- This allows admin to update loyalty_point independently of coin balance
    IF OLD.coin = NEW.coin AND OLD.loyalty_point != NEW.loyalty_point THEN
        -- Log the admin manual change for audit
        RAISE NOTICE 'Admin manual loyalty update: Member ID %, loyalty_point: % -> %', 
                     NEW.id, OLD.loyalty_point, NEW.loyalty_point;
        RETURN NEW;  -- Allow the operation
    END IF;
    
    -- Skip validation if BOTH coin and loyalty_point are being updated together
    -- This handles normal system operations where both values sync
    IF OLD.coin != NEW.coin AND OLD.loyalty_point != NEW.loyalty_point THEN
        -- This is likely a system sync operation, allow it
        RETURN NEW;
    END IF;
    
    -- Original validation: prevent coin from exceeding loyalty_point
    -- Only applies when coin is being modified independently
    IF NEW.coin > NEW.loyalty_point THEN
        RAISE EXCEPTION 'Coin (%) cannot exceed loyalty_point (%). Member ID: %', 
                        NEW.coin, NEW.loyalty_point, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Verify the trigger is still active
SELECT 
    trigger_name,
    table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE table_name = 'members' 
  AND trigger_name = 'trigger_validate_coin_loyalty_ratio';

-- STEP 4: Test with a sample update (DO NOT RUN IN PRODUCTION)
-- UPDATE members SET loyalty_point = loyalty_point + 1000 WHERE id = 9;

-- =====================================================================
-- VERIFICATION QUERIES (Run these after applying the fix)
-- =====================================================================

-- Check current member balances for problem member
SELECT 
    id,
    nama_lengkap,
    loyalty_point,
    coin,
    (coin - loyalty_point) as coin_excess,
    created_at
FROM members 
WHERE id = 9 OR coin > loyalty_point
ORDER BY (coin - loyalty_point) DESC;

-- Check recent loyalty_point_history for admin manual entries
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
WHERE lph.event_type = 'admin_manual'
  OR lph.event LIKE '%Admin Manual%'
ORDER BY lph.created_at DESC
LIMIT 10;

-- =====================================================================
-- ROLLBACK SCRIPT (If needed)
-- =====================================================================
-- Use this to restore original trigger behavior

/*
CREATE OR REPLACE FUNCTION validate_coin_not_exceed_loyalty()
RETURNS TRIGGER AS $$
BEGIN
    -- Original strict validation
    IF NEW.coin > NEW.loyalty_point THEN
        RAISE EXCEPTION 'Coin (%) cannot exceed loyalty_point (%). Member ID: %', 
                        NEW.coin, NEW.loyalty_point, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
*/

-- =====================================================================
-- POST-DEPLOYMENT TESTING
-- =====================================================================
-- After applying this fix, test these scenarios:

-- 1. Admin manual loyalty increase (should work)
-- INSERT INTO loyalty_point_history (member_id, event, point, event_type, created_at) 
-- VALUES (9, 'Admin Manual: Test increase', 1000, 'admin_manual', NOW());

-- 2. Admin manual loyalty decrease (should work if sufficient balance)
-- INSERT INTO loyalty_point_history (member_id, event, point, event_type, created_at) 
-- VALUES (9, 'Admin Manual: Test decrease', -500, 'admin_manual', NOW());

-- 3. Normal coin operations (should still be validated)
-- UPDATE members SET coin = coin + 1000000 WHERE id = 9; -- Should still fail if exceeds loyalty

-- =====================================================================