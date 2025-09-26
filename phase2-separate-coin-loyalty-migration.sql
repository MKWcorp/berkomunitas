-- =====================================================================
-- PHASE 2: SEPARATE COIN AND LOYALTY SYSTEMS MIGRATION
-- =====================================================================
-- This script prepares for complete separation of coin and loyalty_point
-- systems to eliminate cross-validation conflicts
-- 
-- Date: 2025-09-17
-- Status: FUTURE IMPLEMENTATION (Do not run yet)
-- Prerequisites: Phase 1 trigger fix must be applied first
-- =====================================================================

-- STEP 1: Create separate member_coins table
CREATE TABLE IF NOT EXISTS member_coins (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    coin_balance INTEGER DEFAULT 0 NOT NULL,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_coin_balance CHECK (coin_balance >= 0),
    CONSTRAINT unique_member_coin UNIQUE (member_id)
);

-- Create index for performance
CREATE INDEX idx_member_coins_member_id ON member_coins(member_id);
CREATE INDEX idx_member_coins_balance ON member_coins(coin_balance);

-- STEP 2: Create separate member_loyalty_points table
CREATE TABLE IF NOT EXISTS member_loyalty_points (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    loyalty_balance INTEGER DEFAULT 0 NOT NULL,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_loyalty_balance CHECK (loyalty_balance >= 0),
    CONSTRAINT unique_member_loyalty UNIQUE (member_id)
);

-- Create index for performance
CREATE INDEX idx_member_loyalty_member_id ON member_loyalty_points(member_id);
CREATE INDEX idx_member_loyalty_balance ON member_loyalty_points(loyalty_balance);

-- STEP 3: Migrate existing data from members table
INSERT INTO member_coins (member_id, coin_balance, created_at)
SELECT 
    id,
    COALESCE(coin, 0),
    created_at
FROM members
WHERE id NOT IN (SELECT member_id FROM member_coins)
ON CONFLICT (member_id) DO NOTHING;

INSERT INTO member_loyalty_points (member_id, loyalty_balance, created_at)
SELECT 
    id,
    COALESCE(loyalty_point, 0),
    created_at
FROM members
WHERE id NOT IN (SELECT member_id FROM member_loyalty_points)
ON CONFLICT (member_id) DO NOTHING;

-- STEP 4: Create functions for coin operations
CREATE OR REPLACE FUNCTION update_member_coin_balance(
    p_member_id INTEGER,
    p_amount INTEGER,
    p_operation TEXT DEFAULT 'add'
) RETURNS INTEGER AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    -- Validate operation
    IF p_operation NOT IN ('add', 'subtract', 'set') THEN
        RAISE EXCEPTION 'Invalid operation: %. Must be add, subtract, or set', p_operation;
    END IF;
    
    -- Update coin balance
    IF p_operation = 'add' THEN
        UPDATE member_coins 
        SET coin_balance = coin_balance + p_amount, 
            last_updated = NOW()
        WHERE member_id = p_member_id
        RETURNING coin_balance INTO v_new_balance;
    ELSIF p_operation = 'subtract' THEN
        UPDATE member_coins 
        SET coin_balance = coin_balance - p_amount, 
            last_updated = NOW()
        WHERE member_id = p_member_id
        AND coin_balance >= p_amount  -- Prevent negative balance
        RETURNING coin_balance INTO v_new_balance;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Insufficient coin balance for member %', p_member_id;
        END IF;
    ELSE -- set
        UPDATE member_coins 
        SET coin_balance = p_amount, 
            last_updated = NOW()
        WHERE member_id = p_member_id
        RETURNING coin_balance INTO v_new_balance;
    END IF;
    
    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- STEP 5: Create functions for loyalty operations
CREATE OR REPLACE FUNCTION update_member_loyalty_balance(
    p_member_id INTEGER,
    p_amount INTEGER,
    p_operation TEXT DEFAULT 'add'
) RETURNS INTEGER AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    -- Validate operation
    IF p_operation NOT IN ('add', 'subtract', 'set') THEN
        RAISE EXCEPTION 'Invalid operation: %. Must be add, subtract, or set', p_operation;
    END IF;
    
    -- Update loyalty balance
    IF p_operation = 'add' THEN
        UPDATE member_loyalty_points 
        SET loyalty_balance = loyalty_balance + p_amount, 
            last_updated = NOW()
        WHERE member_id = p_member_id
        RETURNING loyalty_balance INTO v_new_balance;
    ELSIF p_operation = 'subtract' THEN
        UPDATE member_loyalty_points 
        SET loyalty_balance = loyalty_balance - p_amount, 
            last_updated = NOW()
        WHERE member_id = p_member_id
        AND loyalty_balance >= p_amount  -- Prevent negative balance
        RETURNING loyalty_balance INTO v_new_balance;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Insufficient loyalty balance for member %', p_member_id;
        END IF;
    ELSE -- set
        UPDATE member_loyalty_points 
        SET loyalty_balance = p_amount, 
            last_updated = NOW()
        WHERE member_id = p_member_id
        RETURNING loyalty_balance INTO v_new_balance;
    END IF;
    
    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- STEP 6: Create views for backward compatibility
CREATE OR REPLACE VIEW member_balances AS
SELECT 
    m.id,
    m.nama_lengkap,
    m.email,
    COALESCE(mc.coin_balance, 0) as coin,
    COALESCE(mlp.loyalty_balance, 0) as loyalty_point,
    m.created_at
FROM members m
LEFT JOIN member_coins mc ON m.id = mc.member_id
LEFT JOIN member_loyalty_points mlp ON m.id = mlp.member_id;

-- STEP 7: Create audit tables for transaction history
CREATE TABLE IF NOT EXISTS coin_transactions (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id),
    amount INTEGER NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('add', 'subtract', 'set')),
    reason TEXT,
    balance_before INTEGER,
    balance_after INTEGER,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id),
    amount INTEGER NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('add', 'subtract', 'set')),
    reason TEXT,
    balance_before INTEGER,
    balance_after INTEGER,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- STEP 8: Enhanced functions with audit trail
CREATE OR REPLACE FUNCTION update_member_coin_with_audit(
    p_member_id INTEGER,
    p_amount INTEGER,
    p_operation TEXT,
    p_reason TEXT,
    p_created_by TEXT DEFAULT current_user
) RETURNS INTEGER AS $$
DECLARE
    v_balance_before INTEGER;
    v_balance_after INTEGER;
BEGIN
    -- Get current balance
    SELECT coin_balance INTO v_balance_before 
    FROM member_coins WHERE member_id = p_member_id;
    
    -- Update balance
    v_balance_after := update_member_coin_balance(p_member_id, p_amount, p_operation);
    
    -- Record audit trail
    INSERT INTO coin_transactions (
        member_id, amount, operation, reason,
        balance_before, balance_after, created_by
    ) VALUES (
        p_member_id, p_amount, p_operation, p_reason,
        v_balance_before, v_balance_after, p_created_by
    );
    
    RETURN v_balance_after;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_member_loyalty_with_audit(
    p_member_id INTEGER,
    p_amount INTEGER,
    p_operation TEXT,
    p_reason TEXT,
    p_created_by TEXT DEFAULT current_user
) RETURNS INTEGER AS $$
DECLARE
    v_balance_before INTEGER;
    v_balance_after INTEGER;
BEGIN
    -- Get current balance
    SELECT loyalty_balance INTO v_balance_before 
    FROM member_loyalty_points WHERE member_id = p_member_id;
    
    -- Update balance
    v_balance_after := update_member_loyalty_balance(p_member_id, p_amount, p_operation);
    
    -- Record audit trail
    INSERT INTO loyalty_transactions (
        member_id, amount, operation, reason,
        balance_before, balance_after, created_by
    ) VALUES (
        p_member_id, p_amount, p_operation, p_reason,
        v_balance_before, v_balance_after, p_created_by
    );
    
    RETURN v_balance_after;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- VERIFICATION QUERIES (Run after migration)
-- =====================================================================

-- Compare old vs new data
SELECT 
    m.id,
    m.nama_lengkap,
    m.coin as old_coin,
    m.loyalty_point as old_loyalty,
    mc.coin_balance as new_coin,
    mlp.loyalty_balance as new_loyalty,
    (m.coin = mc.coin_balance) as coin_match,
    (m.loyalty_point = mlp.loyalty_balance) as loyalty_match
FROM members m
LEFT JOIN member_coins mc ON m.id = mc.member_id
LEFT JOIN member_loyalty_points mlp ON m.id = mlp.member_id
WHERE m.coin != mc.coin_balance 
   OR m.loyalty_point != mlp.loyalty_balance
ORDER BY m.id;

-- Test new functions
SELECT update_member_loyalty_with_audit(9, 1000, 'add', 'Test admin manual', 'admin_system');
SELECT update_member_coin_with_audit(9, 500, 'add', 'Test coin addition', 'admin_system');

-- =====================================================================
-- CLEANUP (Run only after application is updated)
-- =====================================================================

-- Remove old triggers (after application migration)
-- DROP TRIGGER IF EXISTS trigger_validate_coin_loyalty_ratio ON members;
-- DROP FUNCTION IF EXISTS validate_coin_not_exceed_loyalty();

-- Remove old columns (after application migration)
-- ALTER TABLE members DROP COLUMN IF EXISTS coin;
-- ALTER TABLE members DROP COLUMN IF EXISTS loyalty_point;

-- =====================================================================