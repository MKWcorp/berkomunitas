-- Fix untuk Index Corruption pada task_submissions_pkey
-- Error: heap tid from index tuple points to heap-only tuple

-- OPSI 1: REINDEX (Paling Aman dan Direkomendasikan)
-- Ini akan rebuild index tanpa mengubah data
REINDEX INDEX task_submissions_pkey;

-- Atau reindex seluruh tabel sekaligus (termasuk semua index)
-- REINDEX TABLE task_submissions;

-- OPSI 2: Jika REINDEX gagal, drop dan recreate index
-- HATI-HATI: Jangan jalankan ini kecuali REINDEX gagal
/*
BEGIN;

-- Backup constraint name dulu
-- SELECT conname, contype, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'task_submissions'::regclass AND contype = 'p';

-- Drop primary key constraint (akan drop index juga)
ALTER TABLE task_submissions DROP CONSTRAINT task_submissions_pkey;

-- Recreate primary key (akan create index baru)
ALTER TABLE task_submissions ADD PRIMARY KEY (id);

COMMIT;
*/

-- Setelah fix, cek apakah masih ada masalah
-- Jalankan VACUUM untuk cleanup
VACUUM ANALYZE task_submissions;

-- Verifikasi tidak ada corruption lagi
SELECT * FROM task_submissions WHERE id = 33678;
