-- PRODUCTION-SAFE: Core Coin-Loyalty Sync Solution
-- Phase 1: Foundation Tables & Triggers

-- 1. Simple transaction types lookup
CREATE TABLE transaction_types (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    affects_loyalty BOOLEAN DEFAULT true,
    affects_coin BOOLEAN DEFAULT true,
    is_credit BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert basic transaction types
INSERT INTO transaction_types (type_code, name, affects_loyalty, affects_coin, is_credit) VALUES
('task_completion', 'Task Completion Bonus', true, true, true),
('profile_completion', 'Profile Completion Bonus', true, true, true),
('admin_manual', 'Manual Admin Adjustment', true, true, true),
('reward_redemption', 'Reward Redemption', false, true, false),
('admin_correction', 'Admin Correction', true, true, true);

-- 2. Transaction audit log
CREATE TABLE member_transactions (
    id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES members(id),
    transaction_type_id INT NOT NULL REFERENCES transaction_types(id),
    loyalty_amount INT DEFAULT 0, -- amount affecting loyalty_point
    coin_amount INT DEFAULT 0,    -- amount affecting coin
    description TEXT,
    reference_table VARCHAR(50),  -- source table
    reference_id INT,             -- source record ID
    loyalty_balance_before INT,
    loyalty_balance_after INT,
    coin_balance_before INT,
    coin_balance_after INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Indexes for performance
CREATE INDEX idx_member_transactions_member_id ON member_transactions(member_id);
CREATE INDEX idx_member_transactions_created_at ON member_transactions(created_at DESC);
CREATE INDEX idx_member_transactions_type ON member_transactions(transaction_type_id);

-- 4. Function: Auto-sync coin when loyalty_point_history added
CREATE OR REPLACE FUNCTION sync_coin_after_loyalty_insert()
RETURNS TRIGGER AS $$
DECLARE
    member_before RECORD;
    member_after RECORD;
    trans_type_id INT;
BEGIN
    -- Get member state before update
    SELECT loyalty_point, coin INTO member_before 
    FROM members WHERE id = NEW.member_id;
    
    -- Update coin to match loyalty_point increment
    UPDATE members 
    SET coin = coin + NEW.point
    WHERE id = NEW.member_id;
    
    -- Get member state after update
    SELECT loyalty_point, coin INTO member_after
    FROM members WHERE id = NEW.member_id;
    
    -- Get transaction type ID
    SELECT id INTO trans_type_id 
    FROM transaction_types 
    WHERE type_code = CASE 
        WHEN NEW.event LIKE '%Tugas%' OR NEW.event LIKE '%Task%' THEN 'task_completion'
        WHEN NEW.event LIKE '%Profil%' OR NEW.event LIKE '%Profile%' THEN 'profile_completion'
        WHEN NEW.event_type = 'manual_admin' THEN 'admin_manual'
        ELSE 'admin_manual'
    END;
    
    -- Log the transaction for audit
    INSERT INTO member_transactions (
        member_id, transaction_type_id,
        loyalty_amount, coin_amount,
        description, reference_table, reference_id,
        loyalty_balance_before, loyalty_balance_after,
        coin_balance_before, coin_balance_after
    ) VALUES (
        NEW.member_id, trans_type_id,
        NEW.point, NEW.point, -- both loyalty and coin increased
        NEW.event, 'loyalty_point_history', NEW.id,
        member_before.loyalty_point, member_after.loyalty_point,
        member_before.coin, member_after.coin
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Function: Log redemptions (coin-only decrease)
CREATE OR REPLACE FUNCTION log_redemption_transaction()
RETURNS TRIGGER AS $$
DECLARE
    member_before RECORD;
    member_after RECORD;
    trans_type_id INT;
    reward_cost INT;
BEGIN
    -- Get reward cost
    SELECT point_cost INTO reward_cost 
    FROM rewards WHERE id = NEW.id_reward;
    
    -- Get member state before coin deduction
    SELECT loyalty_point, coin INTO member_before 
    FROM members WHERE id = NEW.id_member;
    
    -- Get member state after coin deduction (should be done by app)
    SELECT loyalty_point, coin INTO member_after
    FROM members WHERE id = NEW.id_member;
    
    -- Get transaction type
    SELECT id INTO trans_type_id 
    FROM transaction_types WHERE type_code = 'reward_redemption';
    
    -- Log the transaction
    INSERT INTO member_transactions (
        member_id, transaction_type_id,
        loyalty_amount, coin_amount,
        description, reference_table, reference_id,
        loyalty_balance_before, loyalty_balance_after,
        coin_balance_before, coin_balance_after
    ) VALUES (
        NEW.id_member, trans_type_id,
        0, -reward_cost, -- only coin decreased, loyalty unchanged
        'Reward Redemption', 'reward_redemptions', NEW.id,
        member_before.loyalty_point, member_after.loyalty_point,
        member_before.coin, member_after.coin
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Function: Validate coin never exceeds loyalty
CREATE OR REPLACE FUNCTION validate_coin_loyalty_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent coin from exceeding loyalty_point
    IF NEW.coin > NEW.loyalty_point THEN
        RAISE EXCEPTION 'Coin (%) cannot exceed loyalty_point (%). Member ID: %', 
                        NEW.coin, NEW.loyalty_point, NEW.id;
    END IF;
    
    -- Prevent negative balances
    IF NEW.coin < 0 THEN
        RAISE EXCEPTION 'Coin balance cannot be negative. Member ID: %', NEW.id;
    END IF;
    
    IF NEW.loyalty_point < 0 THEN
        RAISE EXCEPTION 'Loyalty point cannot be negative. Member ID: %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create triggers
CREATE TRIGGER trigger_sync_coin_after_loyalty
    AFTER INSERT ON loyalty_point_history
    FOR EACH ROW
    EXECUTE FUNCTION sync_coin_after_loyalty_insert();

CREATE TRIGGER trigger_log_redemption
    AFTER INSERT ON reward_redemptions
    FOR EACH ROW
    EXECUTE FUNCTION log_redemption_transaction();

CREATE TRIGGER trigger_validate_member_balances
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION validate_coin_loyalty_consistency();

-- 8. Create view for easy reporting
CREATE VIEW member_balance_summary AS
SELECT 
    m.id,
    m.nama_lengkap,
    m.loyalty_point,
    m.coin,
    (m.loyalty_point - m.coin) as difference,
    CASE 
        WHEN m.loyalty_point = m.coin THEN 'SYNCED'
        WHEN m.coin < m.loyalty_point THEN 'COIN_DEFICIT' 
        ELSE 'INCONSISTENT'
    END as status,
    m.tanggal_daftar
FROM members m
ORDER BY m.loyalty_point DESC;
