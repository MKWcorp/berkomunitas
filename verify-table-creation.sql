-- Verify bc_drwskincare_plus_verified table creation and test basic functionality
-- Run this AFTER creating the table

\echo 'Verifying bc_drwskincare_plus_verified table creation...'

-- Check if table was created successfully
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'bc_drwskincare_plus_verified'
    ) THEN '✅ bc_drwskincare_plus_verified table created successfully'
    ELSE '❌ bc_drwskincare_plus_verified table creation failed'
    END as status;

-- Show table structure
\echo 'Table structure:'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bc_drwskincare_plus_verified'
ORDER BY ordinal_position;

-- Show foreign key constraints
\echo 'Foreign key relationships:'
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'bc_drwskincare_plus_verified';

-- Show indexes
\echo 'Indexes:'
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'bc_drwskincare_plus_verified';

-- Test basic operations (if prerequisite data exists)
\echo 'Testing basic operations...'

-- Count existing connections
SELECT 
    'bc_drwskincare_plus connections: ' || COUNT(*) as connection_count
FROM bc_drwskincare_plus;

-- Count existing API data
SELECT 
    'bc_drwskincare_api records: ' || COUNT(*) as api_count  
FROM bc_drwskincare_api;

-- Show table comments
\echo 'Table and column comments:'
SELECT 
    obj_description(oid) as table_comment
FROM pg_class 
WHERE relname = 'bc_drwskincare_plus_verified';

SELECT
    col_description(pgc.oid, pa.attnum) as column_comment,
    pa.attname as column_name
FROM pg_class pgc
JOIN pg_attribute pa ON pgc.oid = pa.attrelid
WHERE pgc.relname = 'bc_drwskincare_plus_verified'
    AND pa.attnum > 0
    AND NOT pa.attisdropped
ORDER BY pa.attnum;

\echo 'Table verification complete!'