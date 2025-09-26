-- Verify database tables and relationships before creating bc_drwskincare_plus_verified
-- Run this script first to check if prerequisite tables exist

\echo 'Checking prerequisite tables...'

-- Check if bc_drwskincare_api table exists
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'bc_drwskincare_api'
    ) THEN '✅ bc_drwskincare_api table EXISTS'
    ELSE '❌ bc_drwskincare_api table MISSING'
    END as status;

-- Check if bc_drwskincare_plus table exists  
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'bc_drwskincare_plus'
    ) THEN '✅ bc_drwskincare_plus table EXISTS'
    ELSE '❌ bc_drwskincare_plus table MISSING'
    END as status;

-- Check if bc_drwskincare_plus_verified table exists
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'bc_drwskincare_plus_verified'
    ) THEN '⚠️  bc_drwskincare_plus_verified table ALREADY EXISTS'
    ELSE '✅ bc_drwskincare_plus_verified table READY TO CREATE'
    END as status;

\echo 'Checking table columns...'

-- Show bc_drwskincare_api structure (if exists)
SELECT 
    'bc_drwskincare_api' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'bc_drwskincare_api'
ORDER BY ordinal_position;

-- Show bc_drwskincare_plus structure (if exists)
SELECT 
    'bc_drwskincare_plus' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'bc_drwskincare_plus'
ORDER BY ordinal_position;

\echo 'Ready to create bc_drwskincare_plus_verified table if prerequisites are met.'