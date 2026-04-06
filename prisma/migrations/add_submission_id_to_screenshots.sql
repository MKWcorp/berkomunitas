-- Migration: Add missing columns to tugas_ai_2_screenshots
-- Created: 2026-04-07
-- Description: Add submission_id FK and admin_notes columns to match DEV database

-- Add submission_id column
ALTER TABLE "tugas_ai_2_screenshots" 
  ADD COLUMN IF NOT EXISTS "submission_id" INTEGER;

-- Add admin_notes column
ALTER TABLE "tugas_ai_2_screenshots"
  ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;

-- Add foreign key constraint for submission_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tugas_ai_2_screenshots_submission_id_fkey'
  ) THEN
    ALTER TABLE "tugas_ai_2_screenshots"
      ADD CONSTRAINT "tugas_ai_2_screenshots_submission_id_fkey"
      FOREIGN KEY ("submission_id")
      REFERENCES "tugas_ai_2_submissions"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for submission_id
CREATE INDEX IF NOT EXISTS "idx_tai2scr_submission_id" 
  ON "tugas_ai_2_screenshots"("submission_id");

-- Add comments
COMMENT ON COLUMN "tugas_ai_2_screenshots"."submission_id" IS 'Optional FK to tugas_ai_2_submissions for linking screenshot to submission record';
COMMENT ON COLUMN "tugas_ai_2_screenshots"."admin_notes" IS 'Admin notes or remarks about the screenshot verification';
