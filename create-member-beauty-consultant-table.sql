-- Migration: Create member_beauty_consultant table
-- This table maps community members to their Beauty Consultant accounts

CREATE TABLE member_beauty_consultant (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    bc_id TEXT NOT NULL, -- Reference to bc_drwskincare_api.id
    -- Verification data yang diinput user saat connect
    input_phone VARCHAR(20) NOT NULL, -- No WA yang diinput user untuk verifikasi
    -- Status
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
    verified_at TIMESTAMP,
    verified_by INTEGER REFERENCES members(id), -- Admin yang verify
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(member_id), -- Satu member hanya bisa connect ke satu BC account
    UNIQUE(bc_id), -- Satu BC account hanya bisa diconnect ke satu member
    
    -- Foreign key constraint ke bc_drwskincare_api
    FOREIGN KEY (bc_id) REFERENCES bc_drwskincare_api(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_member_bc_member_id ON member_beauty_consultant(member_id);
CREATE INDEX idx_member_bc_reseller_id ON member_beauty_consultant(reseller_id);
CREATE INDEX idx_member_bc_status ON member_beauty_consultant(verification_status);
CREATE INDEX idx_member_bc_verified_at ON member_beauty_consultant(verified_at);

-- Trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_member_bc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_member_bc_updated_at
    BEFORE UPDATE ON member_beauty_consultant
    FOR EACH ROW
    EXECUTE FUNCTION update_member_bc_updated_at();