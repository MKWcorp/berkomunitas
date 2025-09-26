-- Test script to verify the new database structure and relationships
-- This script demonstrates how the tables connect together

-- First, let's look at the table structures to understand the relationships
SELECT 
    'bc_drwskincare_api' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'bc_drwskincare_api'
ORDER BY ordinal_position;

SELECT 
    'bc_drwskincare_plus' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'bc_drwskincare_plus'
ORDER BY ordinal_position;

SELECT 
    'bc_drwskincare_plus_verified' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'bc_drwskincare_plus_verified'
ORDER BY ordinal_position;

-- Show foreign key relationships
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'bc_drwskincare_plus_verified';

-- Example query showing how data flows between tables
-- This demonstrates the relationship structure:
-- 1. bc_drwskincare_api contains the dynamic API data that changes frequently
-- 2. bc_drwskincare_plus contains the connection status between users and API data
-- 3. bc_drwskincare_plus_verified contains the editable verified data for BerkomunitasPlus members

/*
Example data flow:

1. User connects to Beauty Consultant via /plus page
   - Record created in bc_drwskincare_plus with user_id and bc_api_id
   - User gets 'berkomunitasplus' privilege

2. User accesses /plus/verified page to manage their data
   - System finds connection record in bc_drwskincare_plus
   - Creates/updates record in bc_drwskincare_plus_verified using connection_id
   - Links to bc_drwskincare_api via api_data_id for reference

3. API data in bc_drwskincare_api can change frequently
   - Verified data remains stable and user-editable
   - Connection status tracked in bc_drwskincare_plus
   - User's custom data stored in bc_drwskincare_plus_verified

Example JOIN query to get all user data:
*/

-- SELECT 
--     u.nama_lengkap as user_name,
--     api.nama_lengkap as api_name,
--     api.nomor_hp as api_phone,
--     conn.created_at as connection_date,
--     verified.nama_lengkap as verified_name,
--     verified.nomor_hp as verified_phone,
--     verified.alamat_lengkap as verified_address,
--     verified.instagram_username,
--     verified.updated_at as last_verified_update
-- FROM users u
-- LEFT JOIN bc_drwskincare_plus conn ON u.id = conn.user_id
-- LEFT JOIN bc_drwskincare_api api ON conn.bc_api_id = api.id
-- LEFT JOIN bc_drwskincare_plus_verified verified ON conn.id = verified.connection_id
-- WHERE u.clerk_user_id = 'USER_CLERK_ID_HERE';