-- Migration: Add missing columns to tugas_ai_2
-- Created: 2026-04-07
-- Description: Adds expires_at, tiktok_content_id, and max_submissions columns

-- Add expires_at column
ALTER TABLE "tugas_ai_2" 
ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMPTZ(6);

-- Add tiktok_content_id column
ALTER TABLE "tugas_ai_2" 
ADD COLUMN IF NOT EXISTS "tiktok_content_id" INTEGER;

-- Add max_submissions column
ALTER TABLE "tugas_ai_2" 
ADD COLUMN IF NOT EXISTS "max_submissions" INTEGER DEFAULT 1;

-- Add indexes
CREATE INDEX IF NOT EXISTS "tugas_ai_2_expires_at_idx" ON "tugas_ai_2"("expires_at");
CREATE INDEX IF NOT EXISTS "tugas_ai_2_tiktok_content_id_idx" ON "tugas_ai_2"("tiktok_content_id");

-- Add comments
COMMENT ON COLUMN "tugas_ai_2"."expires_at" IS 'Task expiration date (null = no expiration)';
COMMENT ON COLUMN "tugas_ai_2"."tiktok_content_id" IS 'FK to tiktok_contents.id for traceability';
COMMENT ON COLUMN "tugas_ai_2"."max_submissions" IS 'Max submissions per user (retry limit)';
