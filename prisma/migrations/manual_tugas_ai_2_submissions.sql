-- =============================================================================
-- MANUAL MIGRATION: tugas_ai_2_submissions
-- Safer than prisma migrate dev (no reset required)
-- Run: node prisma/run-migration.js
-- =============================================================================

-- 1. Add new columns to tugas_ai_2
ALTER TABLE tugas_ai_2
  ADD COLUMN IF NOT EXISTS tiktok_content_id   INTEGER,
  ADD COLUMN IF NOT EXISTS max_submissions      INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS expires_at           TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tugas_ai_2_tiktok_content_id ON tugas_ai_2 (tiktok_content_id);
CREATE INDEX IF NOT EXISTS idx_tugas_ai_2_expires_at ON tugas_ai_2 (expires_at);

-- 2. Create tugas_ai_2_submissions
CREATE TABLE IF NOT EXISTS tugas_ai_2_submissions (
  id                    SERIAL PRIMARY KEY,

  -- Core references
  tugas_ai_2_id         INTEGER       NOT NULL REFERENCES tugas_ai_2(id) ON DELETE CASCADE,
  member_id             INTEGER       NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Platform denormalized from tugas_ai_2.source for query performance
  platform              VARCHAR(50)   NOT NULL DEFAULT 'unknown',

  -- Status machine:
  -- dikerjakan → menunggu_screenshot → sedang_verifikasi → selesai
  --                                                       ↘ gagal → (retry) → dikerjakan
  --              → expired
  status                VARCHAR(50)   NOT NULL DEFAULT 'dikerjakan',

  -- Lifecycle timestamps
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  waktu_klik            TIMESTAMPTZ,          -- kapan user klik "Kerjakan"
  waktu_upload          TIMESTAMPTZ,          -- kapan screenshot pertama diupload
  batas_waktu           TIMESTAMPTZ,          -- deadline = waktu_klik + window
  waktu_verifikasi      TIMESTAMPTZ,          -- kapan status final
  updated_at            TIMESTAMPTZ,

  -- Verification
  verification_attempts INTEGER       NOT NULL DEFAULT 0,
  max_retries           INTEGER       NOT NULL DEFAULT 3,
  verified_by           VARCHAR(255),         -- 'n8n_ai' | 'admin:123' | 'auto'

  -- Result
  point_awarded         INTEGER,              -- poin aktual yang diberikan

  -- Audit
  notes                 TEXT,
  rejection_reason      VARCHAR(500),
  metadata              JSONB,                -- { ip, user_agent, tiktok_username, etc }

  -- 1 user hanya bisa punya 1 submission aktif per task
  CONSTRAINT uq_tugas_ai_2_submissions_member_task UNIQUE (member_id, tugas_ai_2_id)
);

CREATE INDEX IF NOT EXISTS idx_tai2sub_tugas_ai_2_id     ON tugas_ai_2_submissions (tugas_ai_2_id);
CREATE INDEX IF NOT EXISTS idx_tai2sub_member_id         ON tugas_ai_2_submissions (member_id);
CREATE INDEX IF NOT EXISTS idx_tai2sub_status            ON tugas_ai_2_submissions (status);
CREATE INDEX IF NOT EXISTS idx_tai2sub_platform          ON tugas_ai_2_submissions (platform);
CREATE INDEX IF NOT EXISTS idx_tai2sub_batas_waktu       ON tugas_ai_2_submissions (batas_waktu);
CREATE INDEX IF NOT EXISTS idx_tai2sub_member_status     ON tugas_ai_2_submissions (member_id, status);
CREATE INDEX IF NOT EXISTS idx_tai2sub_platform_status   ON tugas_ai_2_submissions (platform, status);
CREATE INDEX IF NOT EXISTS idx_tai2sub_created_at        ON tugas_ai_2_submissions (created_at);

-- 3. Add submission_id to tugas_ai_2_screenshots (replaces task_submission_id)
ALTER TABLE tugas_ai_2_screenshots
  ADD COLUMN IF NOT EXISTS submission_id INTEGER REFERENCES tugas_ai_2_submissions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tai2scr_submission_id ON tugas_ai_2_screenshots (submission_id);

-- 4. Verify
DO $$
BEGIN
  RAISE NOTICE 'Migration complete.';
  RAISE NOTICE 'Tables: tugas_ai_2_submissions created, tugas_ai_2 updated, tugas_ai_2_screenshots updated.';
END $$;
