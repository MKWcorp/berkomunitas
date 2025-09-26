-- Migration: Create bc_drwskincare_api table
-- This table stores Beauty Consultant data from DRW Skincare API

CREATE TABLE bc_drwskincare_api (
    id SERIAL PRIMARY KEY,
    -- Primary identifiers
    reseller_id TEXT UNIQUE NOT NULL, -- Primary Beauty Consultant ID dari DRW API
    api_reseller_id TEXT, -- Alternative ID field if exists
    nomor_hp TEXT, -- Nomor HP/WA from API
    
    -- Basic info
    nama_reseller TEXT NOT NULL, -- Nama Beauty Consultant
    email_address TEXT, -- Email Beauty Consultant
    whatsapp_number TEXT, -- WhatsApp number (might be different from nomor_hp)
    
    -- Location data
    alamat TEXT, -- Alamat lengkap
    area TEXT, -- Area/wilayah
    city TEXT, -- Kota
    kabupaten TEXT, -- Kabupaten
    kecamatan TEXT, -- Kecamatan
    provinsi TEXT, -- Provinsi
    
    -- Profile data
    bio TEXT, -- Bio/description
    photo_url TEXT, -- URL foto profil
    level TEXT, -- Level/tier Beauty Consultant
    
    -- Social media & contact
    facebook TEXT, -- Facebook profile
    instagram TEXT, -- Instagram profile
    
    -- Financial data
    bank TEXT, -- Bank name
    rekening TEXT, -- Nomor rekening
    
    -- API metadata
    api_data JSONB, -- Raw response dari API untuk fleksibilitas
    last_user_update TIMESTAMPTZ, -- Kapan terakhir user update data di sistem DRW
    
    -- System metadata
    clerk_user_id TEXT, -- If connected to our system
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_api_sync_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes untuk performance
CREATE INDEX idx_bc_drwskincare_reseller_id ON bc_drwskincare_api(reseller_id);
CREATE INDEX idx_bc_drwskincare_api_reseller_id ON bc_drwskincare_api(api_reseller_id);
CREATE INDEX idx_bc_drwskincare_nomor_hp ON bc_drwskincare_api(nomor_hp);
CREATE INDEX idx_bc_drwskincare_whatsapp ON bc_drwskincare_api(whatsapp_number);
CREATE INDEX idx_bc_drwskincare_email ON bc_drwskincare_api(email_address);
CREATE INDEX idx_bc_drwskincare_clerk_user ON bc_drwskincare_api(clerk_user_id);
CREATE INDEX idx_bc_drwskincare_level ON bc_drwskincare_api(level);
CREATE INDEX idx_bc_drwskincare_area ON bc_drwskincare_api(area);
CREATE INDEX idx_bc_drwskincare_last_synced ON bc_drwskincare_api(last_api_sync_at);

-- Trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_bc_drwskincare_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bc_drwskincare_updated_at
    BEFORE UPDATE ON bc_drwskincare_api
    FOR EACH ROW
    EXECUTE FUNCTION update_bc_drwskincare_updated_at();