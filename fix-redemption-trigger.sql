-- Fix trigger untuk redemption log (point_cost bukan cost)
CREATE OR REPLACE FUNCTION log_redemption_transaction()
RETURNS TRIGGER AS $$
DECLARE
    member_before RECORD;
    member_after RECORD;
    trans_type_id INT;
    reward_cost INT;
BEGIN
    -- Get reward cost (field name is point_cost)
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
