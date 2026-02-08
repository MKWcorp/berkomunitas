-- Migration: Add tugas_ai_2 and screenshot verification system
-- Created: 2026-02-08
-- Description: Adds new tables for manual tasks with screenshot verification
--              WITHOUT modifying existing task_submissions table
-- Safe: YES - No data drift, no breaking changes

-- =====================================================
-- Table: tugas_ai_2
-- Purpose: Master table for tasks requiring screenshot verification
-- =====================================================
CREATE TABLE IF NOT EXISTS "tugas_ai_2" (
    "id" SERIAL PRIMARY KEY,
    "keyword_tugas" VARCHAR(255),
    "deskripsi_tugas" TEXT,
    "link_postingan" TEXT,
    "status" VARCHAR(50) DEFAULT 'tersedia' NOT NULL,
    "point_value" INTEGER DEFAULT 10,
    "source" VARCHAR(50),
    "verification_rules" JSONB,
    "post_timestamp" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6)
);

-- Indexes for tugas_ai_2
CREATE INDEX IF NOT EXISTS "idx_tugas_ai_2_status" ON "tugas_ai_2"("status");
CREATE INDEX IF NOT EXISTS "idx_tugas_ai_2_source" ON "tugas_ai_2"("source");

-- Comments for documentation
COMMENT ON TABLE "tugas_ai_2" IS 'Tasks requiring screenshot verification (manual/apify sourced)';
COMMENT ON COLUMN "tugas_ai_2"."source" IS 'Source of task: apify or manual';
COMMENT ON COLUMN "tugas_ai_2"."verification_rules" IS 'JSON rules for AI verification: keywords, min_confidence, etc';

-- =====================================================
-- Table: tugas_ai_2_screenshots
-- Purpose: Store screenshot data and AI verification results
-- =====================================================
CREATE TABLE IF NOT EXISTS "tugas_ai_2_screenshots" (
    "id" SERIAL PRIMARY KEY,
    "tugas_ai_2_id" INTEGER NOT NULL,
    "task_submission_id" INTEGER,
    "screenshot_url" TEXT NOT NULL,
    "screenshot_filename" VARCHAR(255),
    "link_komentar" TEXT,
    "uploaded_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- AI/OCR Processing Results
    "ai_extracted_text" TEXT,
    "ai_confidence_score" DOUBLE PRECISION,
    "ai_verification_result" JSONB,
    
    -- n8n Integration
    "n8n_webhook_id" VARCHAR(255),
    "n8n_execution_id" VARCHAR(255),
    "processing_started_at" TIMESTAMPTZ(6),
    "processing_completed_at" TIMESTAMPTZ(6),
    
    -- Timestamps
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    
    -- Foreign Keys
    CONSTRAINT "fk_tugas_ai_2_screenshots_tugas_ai_2" 
        FOREIGN KEY ("tugas_ai_2_id") 
        REFERENCES "tugas_ai_2"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Indexes for tugas_ai_2_screenshots
CREATE INDEX IF NOT EXISTS "idx_tugas_ai_2_screenshots_tugas_ai_2_id" ON "tugas_ai_2_screenshots"("tugas_ai_2_id");
CREATE INDEX IF NOT EXISTS "idx_tugas_ai_2_screenshots_task_submission_id" ON "tugas_ai_2_screenshots"("task_submission_id");
CREATE INDEX IF NOT EXISTS "idx_tugas_ai_2_screenshots_n8n_webhook_id" ON "tugas_ai_2_screenshots"("n8n_webhook_id");
CREATE INDEX IF NOT EXISTS "idx_tugas_ai_2_screenshots_uploaded_at" ON "tugas_ai_2_screenshots"("uploaded_at");

-- Comments for documentation
COMMENT ON TABLE "tugas_ai_2_screenshots" IS 'Screenshot submissions and AI verification results for tugas_ai_2';
COMMENT ON COLUMN "tugas_ai_2_screenshots"."ai_extracted_text" IS 'Text extracted from screenshot via OCR';
COMMENT ON COLUMN "tugas_ai_2_screenshots"."ai_confidence_score" IS 'AI confidence score (0.0 - 1.0)';
COMMENT ON COLUMN "tugas_ai_2_screenshots"."ai_verification_result" IS 'Complete AI verification result in JSON format';
COMMENT ON COLUMN "tugas_ai_2_screenshots"."task_submission_id" IS 'Optional reference to task_submissions for backward compatibility';

-- =====================================================
-- NOTE: task_submissions table is NOT modified
-- We will use existing columns:
-- - comment_id -> Will reference tugas_ai_2_screenshots.id
-- - validation_status -> Will store AI verification status
-- - keterangan -> Will store rejection reasons
-- - waktu_klik -> Will store screenshot upload time
-- =====================================================

-- Grant necessary permissions (adjust based on your DB user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON tugas_ai_2 TO your_db_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON tugas_ai_2_screenshots TO your_db_user;
-- GRANT USAGE, SELECT ON SEQUENCE tugas_ai_2_id_seq TO your_db_user;
-- GRANT USAGE, SELECT ON SEQUENCE tugas_ai_2_screenshots_id_seq TO your_db_user;
