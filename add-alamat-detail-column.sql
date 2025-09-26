-- Add alamat_detail column to bc_drwskincare_plus_verified table
-- This column will store detailed address information from the form

ALTER TABLE bc_drwskincare_plus_verified 
ADD COLUMN alamat_detail TEXT NULL;

-- Add comment to describe the column purpose
COMMENT ON COLUMN bc_drwskincare_plus_verified.alamat_detail IS 'Detailed address information including street, RT/RW, house number, landmarks, etc.';

-- Optional: Add index if you plan to search by alamat_detail frequently
-- CREATE INDEX idx_bc_drwskincare_plus_verified_alamat_detail ON bc_drwskincare_plus_verified(alamat_detail);

-- Verify the column has been added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bc_drwskincare_plus_verified' 
  AND column_name = 'alamat_detail';