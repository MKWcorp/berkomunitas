-- Migration: Add berkomunitasplus privilege to user_privileges system
-- Date: September 18, 2025
-- Purpose: Support 4-tier privilege system: user, berkomunitasplus, partner, admin

-- First, let's check if the user_privileges table exists and has the expected structure
-- If not, create it with the new 4-tier system

-- Create user_privileges table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_privileges (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    privilege VARCHAR(50) NOT NULL CHECK (privilege IN ('user', 'berkomunitasplus', 'partner', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    granted_by INTEGER REFERENCES members(id), -- Who granted this privilege
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL for permanent privileges
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one active privilege per member
    CONSTRAINT unique_active_privilege_per_member 
    UNIQUE (member_id, is_active) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_privileges_member_id ON user_privileges(member_id);
CREATE INDEX IF NOT EXISTS idx_user_privileges_privilege ON user_privileges(privilege);
CREATE INDEX IF NOT EXISTS idx_user_privileges_active ON user_privileges(is_active);
CREATE INDEX IF NOT EXISTS idx_user_privileges_expires ON user_privileges(expires_at);

-- Insert default 'user' privilege for all members who don't have any privilege yet
-- This ensures backward compatibility
INSERT INTO user_privileges (member_id, privilege, is_active, granted_at, notes)
SELECT 
    id,
    'user',
    true,
    CURRENT_TIMESTAMP,
    'Default privilege assigned during berkomunitasplus migration'
FROM members m
WHERE NOT EXISTS (
    SELECT 1 FROM user_privileges up 
    WHERE up.member_id = m.id AND up.is_active = true
);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_privileges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS user_privileges_updated_at_trigger ON user_privileges;
CREATE TRIGGER user_privileges_updated_at_trigger
    BEFORE UPDATE ON user_privileges
    FOR EACH ROW
    EXECUTE FUNCTION update_user_privileges_updated_at();

-- Update rewards table to support privilege requirements if column doesn't exist
ALTER TABLE rewards 
ADD COLUMN IF NOT EXISTS required_privilege VARCHAR(50) DEFAULT NULL 
CHECK (required_privilege IN (NULL, 'user', 'berkomunitasplus', 'partner', 'admin'));

-- Create index on required_privilege for performance
CREATE INDEX IF NOT EXISTS idx_rewards_required_privilege ON rewards(required_privilege);

-- Example: Update some existing rewards to require berkomunitasplus
-- (Uncomment and modify as needed)
-- UPDATE rewards 
-- SET required_privilege = 'berkomunitasplus' 
-- WHERE reward_name ILIKE '%premium%' OR reward_name ILIKE '%plus%' OR point_cost > 1000;

-- Create a view for easy privilege checking
CREATE OR REPLACE VIEW active_member_privileges AS
SELECT 
    m.id as member_id,
    m.clerk_id,
    m.nama_lengkap,
    m.email,
    up.privilege,
    up.granted_at,
    up.expires_at,
    CASE 
        WHEN up.expires_at IS NULL THEN true
        WHEN up.expires_at > CURRENT_TIMESTAMP THEN true
        ELSE false
    END as is_valid,
    up.notes
FROM members m
LEFT JOIN user_privileges up ON m.id = up.member_id AND up.is_active = true;

-- Create helper function to check if user has privilege
CREATE OR REPLACE FUNCTION user_has_privilege(p_member_id INTEGER, p_required_privilege VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    user_privilege VARCHAR;
    privilege_hierarchy INTEGER;
    required_hierarchy INTEGER;
BEGIN
    -- Get user's current active privilege
    SELECT privilege INTO user_privilege
    FROM user_privileges 
    WHERE member_id = p_member_id 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    LIMIT 1;
    
    -- If no privilege found, default to 'user'
    IF user_privilege IS NULL THEN
        user_privilege := 'user';
    END IF;
    
    -- Define privilege hierarchy (higher number = more privileges)
    privilege_hierarchy := CASE user_privilege
        WHEN 'admin' THEN 4
        WHEN 'partner' THEN 3
        WHEN 'berkomunitasplus' THEN 2
        WHEN 'user' THEN 1
        ELSE 0
    END;
    
    required_hierarchy := CASE p_required_privilege
        WHEN 'admin' THEN 4
        WHEN 'partner' THEN 3
        WHEN 'berkomunitasplus' THEN 2
        WHEN 'user' THEN 1
        ELSE 0
    END;
    
    -- User has privilege if their hierarchy level is >= required level
    RETURN privilege_hierarchy >= required_hierarchy;
END;
$$ LANGUAGE plpgsql;

-- Create function to upgrade user to berkomunitasplus
CREATE OR REPLACE FUNCTION upgrade_to_berkomunitasplus(
    p_member_id INTEGER,
    p_granted_by INTEGER DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_notes TEXT DEFAULT 'Upgraded to BerkomunitsPlus'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Deactivate current privilege
    UPDATE user_privileges 
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE member_id = p_member_id AND is_active = true;
    
    -- Insert new berkomunitasplus privilege
    INSERT INTO user_privileges (
        member_id, 
        privilege, 
        is_active, 
        granted_by, 
        expires_at, 
        notes
    ) VALUES (
        p_member_id,
        'berkomunitasplus',
        true,
        p_granted_by,
        p_expires_at,
        p_notes
    );
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Example usage comments:
-- To upgrade a user to berkomunitasplus:
-- SELECT upgrade_to_berkomunitasplus(member_id, admin_member_id, NULL, 'Manual upgrade');

-- To check if user has berkomunitasplus:
-- SELECT user_has_privilege(member_id, 'berkomunitasplus');

-- To get all berkomunitasplus members:
-- SELECT * FROM active_member_privileges WHERE privilege = 'berkomunitasplus' AND is_valid = true;

COMMIT;