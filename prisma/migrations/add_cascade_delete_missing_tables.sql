-- Migration: Add CASCADE DELETE to missing foreign keys
-- SAFE MIGRATION - Tidak mengubah data, hanya mengubah constraint
-- This ensures when a member is deleted, all related data is also deleted

-- ============================================
-- PRE-MIGRATION CHECK
-- ============================================
-- Cek apakah ada orphaned records (data yang referensinya sudah tidak ada)
-- Jika ada, migration akan gagal dan perlu dibersihkan dulu

DO $$
BEGIN
    -- Check orphaned task_submissions
    IF EXISTS (
        SELECT 1 FROM task_submissions ts
        LEFT JOIN members m ON ts.id_member = m.id
        WHERE m.id IS NULL
    ) THEN
        RAISE NOTICE 'WARNING: Found orphaned records in task_submissions';
        RAISE NOTICE 'Run this query to see them: SELECT * FROM task_submissions ts LEFT JOIN members m ON ts.id_member = m.id WHERE m.id IS NULL;';
    END IF;

    -- Check orphaned reward_redemptions
    IF EXISTS (
        SELECT 1 FROM reward_redemptions rr
        LEFT JOIN members m ON rr.id_member = m.id
        WHERE m.id IS NULL
    ) THEN
        RAISE NOTICE 'WARNING: Found orphaned records in reward_redemptions';
        RAISE NOTICE 'Run this query to see them: SELECT * FROM reward_redemptions rr LEFT JOIN members m ON rr.id_member = m.id WHERE m.id IS NULL;';
    END IF;

    -- Check orphaned member_transactions
    IF EXISTS (
        SELECT 1 FROM member_transactions mt
        LEFT JOIN members m ON mt.member_id = m.id
        WHERE m.id IS NULL
    ) THEN
        RAISE NOTICE 'WARNING: Found orphaned records in member_transactions';
        RAISE NOTICE 'Run this query to see them: SELECT * FROM member_transactions mt LEFT JOIN members m ON mt.member_id = m.id WHERE m.id IS NULL;';
    END IF;
END $$;

-- ============================================
-- MIGRATION EXECUTION (dalam transaction)
-- ============================================

BEGIN;

-- 1. Fix task_submissions - currently has no onDelete clause
-- SAFE: Hanya mengubah constraint, tidak mengubah data
ALTER TABLE "task_submissions" 
DROP CONSTRAINT IF EXISTS "task_submissions_id_member_fkey";

ALTER TABLE "task_submissions"
ADD CONSTRAINT "task_submissions_id_member_fkey" 
FOREIGN KEY ("id_member") 
REFERENCES "members"("id") 
ON DELETE CASCADE 
ON UPDATE NO ACTION;

-- 2. Fix reward_redemptions - currently has onDelete: NoAction
-- SAFE: Hanya mengubah constraint, tidak mengubah data
ALTER TABLE "reward_redemptions"
DROP CONSTRAINT IF EXISTS "fk_member";

ALTER TABLE "reward_redemptions"
ADD CONSTRAINT "fk_member" 
FOREIGN KEY ("id_member") 
REFERENCES "members"("id") 
ON DELETE CASCADE 
ON UPDATE NO ACTION;

-- 3. Fix member_transactions - currently has onDelete: NoAction
-- SAFE: Hanya mengubah constraint, tidak mengubah data
ALTER TABLE "member_transactions"
DROP CONSTRAINT IF EXISTS "member_transactions_member_id_fkey";

ALTER TABLE "member_transactions"
ADD CONSTRAINT "member_transactions_member_id_fkey" 
FOREIGN KEY ("member_id") 
REFERENCES "members"("id") 
ON DELETE CASCADE 
ON UPDATE NO ACTION;

-- ============================================
-- VERIFICATION (SIMPLIFIED)
-- ============================================
-- Verifikasi bahwa semua constraint sudah benar

DO $$
BEGIN
    RAISE NOTICE 'SUCCESS: Migration executed. Verifying constraints...';
    
    -- Just check if the 3 specific constraints exist with CASCADE
    IF EXISTS (
        SELECT 1 FROM information_schema.referential_constraints rc
        JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'task_submissions' 
          AND tc.constraint_name = 'task_submissions_id_member_fkey'
          AND rc.delete_rule = 'CASCADE'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.referential_constraints rc
        JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'reward_redemptions' 
          AND tc.constraint_name = 'fk_member'
          AND rc.delete_rule = 'CASCADE'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.referential_constraints rc
        JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'member_transactions' 
          AND tc.constraint_name = 'member_transactions_member_id_fkey'
          AND rc.delete_rule = 'CASCADE'
    ) THEN
        RAISE NOTICE 'SUCCESS: All 3 target constraints verified with CASCADE DELETE!';
    ELSE
        RAISE WARNING 'Some constraints may not have CASCADE DELETE. Please verify manually.';
    END IF;
END $$;

COMMIT;

-- ============================================
-- POST-MIGRATION VERIFICATION QUERY
-- ============================================
-- Jalankan query ini untuk memastikan constraint sudah benar
SELECT 
    tc.table_name, 
    kcu.column_name,
    rc.delete_rule,
    rc.update_rule,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'members'
  AND tc.table_name IN ('task_submissions', 'reward_redemptions', 'member_transactions')
ORDER BY tc.table_name;

-- Expected output: All 3 tables should have delete_rule = 'CASCADE'
