-- Add member_id column to tugas_ai_2_screenshots for proper member tracking
-- Migration: Add member_id to tugas_ai_2_screenshots
-- Date: February 8, 2026

-- Add member_id column (nullable first for existing data)
ALTER TABLE tugas_ai_2_screenshots 
ADD COLUMN member_id INT;

-- Create index for better query performance
CREATE INDEX idx_tugas_ai_2_screenshots_member_id ON tugas_ai_2_screenshots(member_id);

-- Add composite index for common query pattern (task + member)
CREATE INDEX idx_tugas_ai_2_screenshots_task_member ON tugas_ai_2_screenshots(tugas_ai_2_id, member_id);

-- Add status column for tracking verification status
ALTER TABLE tugas_ai_2_screenshots 
ADD COLUMN status VARCHAR(50) DEFAULT 'sedang_verifikasi';

CREATE INDEX idx_tugas_ai_2_screenshots_status ON tugas_ai_2_screenshots(status);

-- Add verified_at timestamp
ALTER TABLE tugas_ai_2_screenshots 
ADD COLUMN verified_at TIMESTAMPTZ;

-- Add verification_attempts counter
ALTER TABLE tugas_ai_2_screenshots
ADD COLUMN verification_attempts INT DEFAULT 0;

-- Comments for documentation
COMMENT ON COLUMN tugas_ai_2_screenshots.member_id IS 'ID member yang mengupload screenshot';
COMMENT ON COLUMN tugas_ai_2_screenshots.status IS 'Status: sedang_verifikasi, selesai, gagal_diverifikasi';
COMMENT ON COLUMN tugas_ai_2_screenshots.verified_at IS 'Timestamp when AI verification completed';
COMMENT ON COLUMN tugas_ai_2_screenshots.verification_attempts IS 'Number of verification attempts';
