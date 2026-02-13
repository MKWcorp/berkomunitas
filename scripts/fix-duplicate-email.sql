-- Fix duplicate email issue
-- Step 1: Check for duplicate emails
SELECT email, COUNT(*) as count, array_agg(id ORDER BY id) as user_ids
FROM members
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Step 2: Delete the duplicate user (user 516 - the newly created one)
-- Keep user 24 (the original one)
DELETE FROM members WHERE id = 516;

-- Step 3: Verify no more duplicates
SELECT email, COUNT(*) as count
FROM members
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;
