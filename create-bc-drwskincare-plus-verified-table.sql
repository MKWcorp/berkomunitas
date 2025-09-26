-- Create table for BerkomunitasPlus verified data
-- This table stores editable verified information for BerkomunitasPlus members
-- Connects to bc_drwskincare_api for dynamic API data and bc_drwskincare_plus for connection status

CREATE TABLE IF NOT EXISTS bc_drwskincare_plus_verified (
    id SERIAL PRIMARY KEY,
    api_data_id TEXT REFERENCES bc_drwskincare_api(id) ON DELETE SET NULL,
    connection_id INTEGER REFERENCES bc_drwskincare_plus(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(255) NOT NULL,
    nomor_hp VARCHAR(20),
    alamat_lengkap TEXT,
    instagram_username VARCHAR(100),
    facebook_username VARCHAR(100),
    tiktok_username VARCHAR(100),
    youtube_username VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index to ensure one record per connection
CREATE UNIQUE INDEX IF NOT EXISTS idx_bc_drwskincare_plus_verified_connection_id 
ON bc_drwskincare_plus_verified(connection_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bc_drwskincare_plus_verified_created_at 
ON bc_drwskincare_plus_verified(created_at);

CREATE INDEX IF NOT EXISTS idx_bc_drwskincare_plus_verified_api_data_id 
ON bc_drwskincare_plus_verified(api_data_id);

-- Add comment for documentation
COMMENT ON TABLE bc_drwskincare_plus_verified IS 
'Stores verified personal data that BerkomunitasPlus members can edit and manage. Connected to API data and connection status.';

COMMENT ON COLUMN bc_drwskincare_plus_verified.api_data_id IS 
'Reference to bc_drwskincare_api table - links to dynamic API data that changes frequently (TEXT type to match bc_drwskincare_api.id)';

COMMENT ON COLUMN bc_drwskincare_plus_verified.connection_id IS 
'Reference to bc_drwskincare_plus table - shows connection status and relationship';

COMMENT ON COLUMN bc_drwskincare_plus_verified.nama_lengkap IS 
'Full name as verified by BerkomunitasPlus member (editable)';

COMMENT ON COLUMN bc_drwskincare_plus_verified.nomor_hp IS 
'Phone number for verification and contact (editable)';

COMMENT ON COLUMN bc_drwskincare_plus_verified.alamat_lengkap IS 
'Complete address for shipping and verification purposes (editable)';

COMMENT ON COLUMN bc_drwskincare_plus_verified.instagram_username IS 
'Instagram username without @ symbol (editable)';

COMMENT ON COLUMN bc_drwskincare_plus_verified.facebook_username IS 
'Facebook username (editable)';

COMMENT ON COLUMN bc_drwskincare_plus_verified.tiktok_username IS 
'TikTok username without @ symbol (editable)';

COMMENT ON COLUMN bc_drwskincare_plus_verified.youtube_username IS 
'YouTube channel username (editable)';

-- Show created table structure
\d bc_drwskincare_plus_verified;