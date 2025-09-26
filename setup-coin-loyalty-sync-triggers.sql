-- PostgreSQL Triggers untuk Auto-Sync Coin dengan Loyalty Point
-- Triggers ini memastikan coin selalu sinkron dengan loyalty_point

-- 1. Function untuk sync coin ketika loyalty_point history ditambah
CREATE OR REPLACE FUNCTION sync_coin_with_loyalty()
RETURNS TRIGGER AS $$
BEGIN
    -- Update coin hanya ketika ada penambahan loyalty_point_history
    -- Coin bertambah sesuai dengan point yang ditambahkan
    UPDATE members 
    SET coin = coin + NEW.point
    WHERE id = NEW.member_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger yang dijalankan setiap ada insert di loyalty_point_history
DROP TRIGGER IF EXISTS trigger_sync_coin_after_loyalty_insert ON loyalty_point_history;
CREATE TRIGGER trigger_sync_coin_after_loyalty_insert
    AFTER INSERT ON loyalty_point_history
    FOR EACH ROW
    EXECUTE FUNCTION sync_coin_with_loyalty();

-- 3. Function untuk memastikan coin tidak pernah melebihi loyalty_point
CREATE OR REPLACE FUNCTION validate_coin_not_exceed_loyalty()
RETURNS TRIGGER AS $$
BEGIN
    -- Pastikan coin tidak pernah > loyalty_point
    IF NEW.coin > NEW.loyalty_point THEN
        RAISE EXCEPTION 'Coin cannot exceed loyalty_point. Coin: %, Loyalty: %', 
                        NEW.coin, NEW.loyalty_point;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger validasi sebelum update members
DROP TRIGGER IF EXISTS trigger_validate_coin_loyalty_ratio ON members;
CREATE TRIGGER trigger_validate_coin_loyalty_ratio
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION validate_coin_not_exceed_loyalty();

-- 5. Function untuk logging semua perubahan coin/loyalty
CREATE OR REPLACE FUNCTION log_coin_loyalty_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log perubahan untuk audit trail
    IF OLD.coin != NEW.coin OR OLD.loyalty_point != NEW.loyalty_point THEN
        INSERT INTO coin_loyalty_audit_log (
            member_id, 
            old_coin, new_coin, 
            old_loyalty, new_loyalty,
            changed_by,
            created_at
        ) VALUES (
            NEW.id,
            OLD.coin, NEW.coin,
            OLD.loyalty_point, NEW.loyalty_point,
            current_user,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Table untuk audit log (optional)
CREATE TABLE IF NOT EXISTS coin_loyalty_audit_log (
    id SERIAL PRIMARY KEY,
    member_id INT NOT NULL,
    old_coin INT,
    new_coin INT,
    old_loyalty INT,
    new_loyalty INT,
    changed_by TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (member_id) REFERENCES members(id)
);

-- 7. Trigger untuk logging
DROP TRIGGER IF EXISTS trigger_log_coin_loyalty_changes ON members;
CREATE TRIGGER trigger_log_coin_loyalty_changes
    AFTER UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION log_coin_loyalty_changes();
