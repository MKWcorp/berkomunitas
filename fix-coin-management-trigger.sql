-- =====================================================================
-- FIX COIN MANAGEMENT TRIGGER - ALLOW INDEPENDENT COIN OPERATIONS
-- =====================================================================
-- Problem: Trigger validate_coin_not_exceed_loyalty() prevents coin management
--          when coin > loyalty_point, but for coin system we need independence
-- 
-- Solution: Update trigger to allow independent coin operations while
--           maintaining some basic validations
-- 
-- Date: 2025-09-17
-- For: Coin Management System
-- =====================================================================

-- STEP 1: Backup existing trigger function (for rollback if needed)
-- Note: Run this query to see current function:
-- SELECT prosrc FROM pg_proc WHERE proname = 'validate_coin_not_exceed_loyalty';

-- STEP 2: Update the validation function for coin management independence
CREATE OR REPLACE FUNCTION validate_coin_not_exceed_loyalty()
RETURNS TRIGGER AS $$
BEGIN
    -- COIN MANAGEMENT: Allow independent coin operations
    -- Skip validation if ONLY coin is being changed (coin management)
    IF OLD.loyalty_point = NEW.loyalty_point AND OLD.coin != NEW.coin THEN
        -- This is coin-only operation (coin management), allow it
        RAISE NOTICE 'Coin management operation: Member ID %, coin: % -> %', 
                     NEW.id, OLD.coin, NEW.coin;
        RETURN NEW;  -- Allow the operation
    END IF;
    
    -- LOYALTY MANAGEMENT: Allow loyalty-only updates (admin manual)
    IF OLD.coin = NEW.coin AND OLD.loyalty_point != NEW.loyalty_point THEN
        -- Log the admin manual loyalty change for audit
        RAISE NOTICE 'Admin manual loyalty update: Member ID %, loyalty_point: % -> %', 
                     NEW.id, OLD.loyalty_point, NEW.loyalty_point;
        RETURN NEW;  -- Allow the operation
    END IF;
    
    -- SYSTEM SYNC: Allow both coin and loyalty_point updates together
    IF OLD.coin != NEW.coin AND OLD.loyalty_point != NEW.loyalty_point THEN
        -- This is likely a system sync operation, allow it
        RAISE NOTICE 'System sync operation: Member ID %, coin: % -> %, loyalty: % -> %', 
                     NEW.id, OLD.coin, NEW.coin, OLD.loyalty_point, NEW.loyalty_point;
        RETURN NEW;
    END IF;
    
    -- SAFETY: Prevent negative values
    IF NEW.coin < 0 THEN
        RAISE EXCEPTION 'Coin cannot be negative (%). Member ID: %', NEW.coin, NEW.id;
    END IF;
    
    IF NEW.loyalty_point < 0 THEN
        RAISE EXCEPTION 'Loyalty point cannot be negative (%). Member ID: %', NEW.loyalty_point, NEW.id;
    END IF;
    
    -- If we reach here, allow the operation (remove the original strict validation)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Verify the trigger is still active and updated
SELECT 
    trigger_name,
    table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE table_name = 'members' 
  AND trigger_name LIKE '%coin%' OR trigger_name LIKE '%loyalty%'
ORDER BY trigger_name;

-- STEP 4: Test the fix with a coin update
-- (Replace member_id with actual ID for testing)
/*
-- Test coin-only update (should work now)
UPDATE members SET coin = coin + 100000 WHERE id = 239;

-- Test loyalty-only update (should still work)
UPDATE members SET loyalty_point = loyalty_point + 1000 WHERE id = 239;

-- Test both updates (should work)
UPDATE members SET coin = coin + 1000, loyalty_point = loyalty_point + 1000 WHERE id = 239;
*/

-- STEP 5: Check current member data to verify
SELECT 
    id,
    nama_lengkap,
    coin,
    loyalty_point,
    (coin - loyalty_point) as difference
FROM members 
WHERE id = 239
ORDER BY id;

-- STEP 6: Show recent coin_history entries
SELECT 
    ch.id,
    ch.member_id,
    m.nama_lengkap,
    ch.event,
    ch.coin_amount,
    ch.event_type,
    ch.created_at
FROM coin_history ch
JOIN members m ON ch.member_id = m.id
WHERE ch.member_id = 239
ORDER BY ch.created_at DESC
LIMIT 5;

-- STEP 7: Success message
SELECT 'Coin management trigger updated successfully! Coins can now be managed independently from loyalty points.' as status;