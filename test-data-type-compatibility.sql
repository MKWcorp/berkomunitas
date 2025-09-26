-- Test data type compatibility for foreign key relationships
-- Run this to verify that data types match correctly

\echo 'Testing data type compatibility...'

-- Check bc_drwskincare_api.id data type
SELECT 
    'bc_drwskincare_api.id' as column_reference,
    data_type,
    character_maximum_length,
    'Should be TEXT or VARCHAR' as expected_type
FROM information_schema.columns 
WHERE table_name = 'bc_drwskincare_api' AND column_name = 'id';

-- Check bc_drwskincare_plus.id data type  
SELECT 
    'bc_drwskincare_plus.id' as column_reference,
    data_type,
    character_maximum_length,
    'Should be INTEGER or SERIAL' as expected_type
FROM information_schema.columns 
WHERE table_name = 'bc_drwskincare_plus' AND column_name = 'id';

-- Sample data from bc_drwskincare_api to see ID format
\echo 'Sample bc_drwskincare_api.id values:'
SELECT 
    id,
    nama_lengkap,
    'API ID format: ' || id as id_format
FROM bc_drwskincare_api 
LIMIT 3;

-- Sample data from bc_drwskincare_plus to see ID format
\echo 'Sample bc_drwskincare_plus.id values:'
SELECT 
    id,
    user_id,
    bc_api_id,
    'Connection ID format: ' || id as id_format
FROM bc_drwskincare_plus 
LIMIT 3;

\echo 'Data type analysis complete!'
\echo 'Now you can safely run the corrected CREATE TABLE script.'