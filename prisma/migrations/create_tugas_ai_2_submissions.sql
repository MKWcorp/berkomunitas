-- Migration: Create tugas_ai_2_submissions table
-- Created: 2026-04-07
-- Description: Create missing tugas_ai_2_submissions table - EXACT COPY from berkomunitas_dev
-- Source: Copied structure from berkomunitas_dev database

-- Create tugas_ai_2_submissions table (exact match with berkomunitas_dev)
CREATE TABLE IF NOT EXISTS "tugas_ai_2_submissions" (
  "id" SERIAL PRIMARY KEY,
  
  -- Core references
  "tugas_ai_2_id" INTEGER NOT NULL,
  "member_id" INTEGER NOT NULL,
  
  -- Platform context
  "platform" VARCHAR(50) NOT NULL DEFAULT 'unknown',
  
  -- Status machine
  "status" VARCHAR(50) NOT NULL DEFAULT 'dikerjakan',
  
  -- Lifecycle timestamps
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "waktu_klik" TIMESTAMPTZ,
  "waktu_upload" TIMESTAMPTZ,
  "batas_waktu" TIMESTAMPTZ,
  "waktu_verifikasi" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  
  -- Verification  
  "verification_attempts" INTEGER NOT NULL DEFAULT 0,
  "max_retries" INTEGER NOT NULL DEFAULT 3,
  "verified_by" VARCHAR(255),
  
  -- Result
  "point_awarded" INTEGER,
  
  -- Audit
  "notes" TEXT,
  "rejection_reason" VARCHAR(500),
  "metadata" JSONB
);

-- Add Foreign Keys (matching berkomunitas_dev naming)
ALTER TABLE "tugas_ai_2_submissions"
  ADD CONSTRAINT "tugas_ai_2_submissions_tugas_ai_2_id_fkey"
    FOREIGN KEY ("tugas_ai_2_id")
    REFERENCES "tugas_ai_2"("id")
    ON DELETE CASCADE;

ALTER TABLE "tugas_ai_2_submissions"
  ADD CONSTRAINT "tugas_ai_2_submissions_member_id_fkey"
    FOREIGN KEY ("member_id")
    REFERENCES "members"("id")
    ON DELETE CASCADE;

-- Add Unique constraint (exact name from berkomunitas_dev)
ALTER TABLE "tugas_ai_2_submissions"
  ADD CONSTRAINT "uq_tugas_ai_2_submissions_member_task"
    UNIQUE ("member_id", "tugas_ai_2_id");

-- Create indexes (exact names from berkomunitas_dev)
CREATE INDEX IF NOT EXISTS "idx_tai2sub_tugas_ai_2_id" ON "tugas_ai_2_submissions"("tugas_ai_2_id");
CREATE INDEX IF NOT EXISTS "idx_tai2sub_member_id" ON "tugas_ai_2_submissions"("member_id");
CREATE INDEX IF NOT EXISTS "idx_tai2sub_status" ON "tugas_ai_2_submissions"("status");
CREATE INDEX IF NOT EXISTS "idx_tai2sub_platform" ON "tugas_ai_2_submissions"("platform");
CREATE INDEX IF NOT EXISTS "idx_tai2sub_batas_waktu" ON "tugas_ai_2_submissions"("batas_waktu");
CREATE INDEX IF NOT EXISTS "idx_tai2sub_member_status" ON "tugas_ai_2_submissions"("member_id", "status");
CREATE INDEX IF NOT EXISTS "idx_tai2sub_platform_status" ON "tugas_ai_2_submissions"("platform", "status");
CREATE INDEX IF NOT EXISTS "idx_tai2sub_created_at" ON "tugas_ai_2_submissions"("created_at");

-- Add comments
COMMENT ON TABLE "tugas_ai_2_submissions" IS 'Submission tracking for tugas_ai_2 tasks';
COMMENT ON COLUMN "tugas_ai_2_submissions"."status" IS 'Status: dikerjakan | menunggu_screenshot | sedang_verifikasi | selesai | gagal | expired';
COMMENT ON COLUMN "tugas_ai_2_submissions"."platform" IS 'Platform: tiktok | facebook | instagram';
