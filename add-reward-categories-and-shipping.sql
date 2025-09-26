-- Migration: Add reward categories and shipping tracking
-- File: add-reward-categories-and-shipping.sql

-- 1. Create reward categories table
CREATE TABLE reward_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20) DEFAULT 'blue',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add category and privilege columns to rewards
ALTER TABLE rewards ADD COLUMN category_id INTEGER REFERENCES reward_categories(id);
ALTER TABLE rewards ADD COLUMN required_privilege VARCHAR(50);
ALTER TABLE rewards ADD COLUMN privilege_description TEXT;
ALTER TABLE rewards ADD COLUMN is_exclusive BOOLEAN DEFAULT false;

-- 3. Add shipping tracking to redemptions
ALTER TABLE reward_redemptions ADD COLUMN shipping_tracking VARCHAR(100);
ALTER TABLE reward_redemptions ADD COLUMN shipping_notes TEXT;
ALTER TABLE reward_redemptions ADD COLUMN shipping_method VARCHAR(50) DEFAULT 'separate';
ALTER TABLE reward_redemptions ADD COLUMN shipped_at TIMESTAMP;
ALTER TABLE reward_redemptions ADD COLUMN delivered_at TIMESTAMP;
ALTER TABLE reward_redemptions ADD COLUMN shipping_cost INTEGER DEFAULT 0;

-- 4. Create indexes for performance
CREATE INDEX idx_rewards_category ON rewards(category_id);
CREATE INDEX idx_rewards_privilege ON rewards(required_privilege);
CREATE INDEX idx_redemptions_shipping ON reward_redemptions(shipping_tracking);

-- 5. Insert default categories
INSERT INTO reward_categories (name, description, icon, color, sort_order) VALUES
('Elektronik', 'Gadget dan perangkat elektronik', 'DevicePhoneMobileIcon', 'blue', 1),
('Fashion', 'Pakaian dan aksesoris', 'ShoppingBagIcon', 'purple', 2),
('Makanan & Minuman', 'Snack, minuman, dan makanan', 'CakeIcon', 'yellow', 3),
('Digital', 'Voucher dan layanan digital', 'GlobeAltIcon', 'green', 4),
('Eksklusif Plus', 'Hadiah khusus member Berkomunitas Plus', 'StarIcon', 'amber', 5),
('Koleksi', 'Merchandise dan barang koleksi', 'GiftIcon', 'pink', 6);

-- 6. Set default category for existing rewards (Elektronik)
UPDATE rewards SET category_id = 1 WHERE category_id IS NULL;

COMMENT ON TABLE reward_categories IS 'Kategorisasi hadiah untuk organisasi yang lebih baik';
COMMENT ON COLUMN rewards.required_privilege IS 'Privilege yang dibutuhkan: admin, partner, berkomunitasplus';
COMMENT ON COLUMN reward_redemptions.shipping_method IS 'Metode pengiriman: separate, combined, pickup';