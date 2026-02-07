-- ROLLBACK SCRIPT: Kembalikan ke behavior NO ACTION
-- Jalankan script ini jika ingin undo migration CASCADE DELETE

-- ============================================
-- ROLLBACK (dalam transaction)
-- ============================================

BEGIN;

-- 1. Rollback task_submissions ke NO ACTION
ALTER TABLE "task_submissions" 
DROP CONSTRAINT IF EXISTS "task_submissions_id_member_fkey";

ALTER TABLE "task_submissions"
ADD CONSTRAINT "task_submissions_id_member_fkey" 
FOREIGN KEY ("id_member") 
REFERENCES "members"("id") 
ON DELETE NO ACTION 
ON UPDATE NO ACTION;

-- 2. Rollback reward_redemptions ke NO ACTION
ALTER TABLE "reward_redemptions"
DROP CONSTRAINT IF EXISTS "fk_member";

ALTER TABLE "reward_redemptions"
ADD CONSTRAINT "fk_member" 
FOREIGN KEY ("id_member") 
REFERENCES "members"("id") 
ON DELETE NO ACTION 
ON UPDATE NO ACTION;

-- 3. Rollback member_transactions ke NO ACTION
ALTER TABLE "member_transactions"
DROP CONSTRAINT IF EXISTS "member_transactions_member_id_fkey";

ALTER TABLE "member_transactions"
ADD CONSTRAINT "member_transactions_member_id_fkey" 
FOREIGN KEY ("member_id") 
REFERENCES "members"("id") 
ON DELETE NO ACTION 
ON UPDATE NO ACTION;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name IN ('task_submissions', 'reward_redemptions', 'member_transactions')
      AND rc.delete_rule = 'NO ACTION';
    
    IF constraint_count = 3 THEN
        RAISE NOTICE 'SUCCESS: Rollback completed! All constraints reverted to NO ACTION';
    ELSE
        RAISE EXCEPTION 'ERROR: Expected 3 NO ACTION constraints, found %', constraint_count;
    END IF;
END $$;

COMMIT;

-- ============================================
-- POST-ROLLBACK VERIFICATION
-- ============================================

SELECT 
    tc.table_name, 
    rc.delete_rule,
    'Should be NO ACTION' as expected_value
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('task_submissions', 'reward_redemptions', 'member_transactions')
ORDER BY tc.table_name;
