# Index Corruption Fix - Task Submissions

## 🚨 Masalah yang Terjadi

**Error:**
```
heap tid from index tuple (447,64) points to heap-only tuple at offset 372 of block 125 in index "task_submissions_pkey"
```

**Query yang Gagal:**
```sql
UPDATE task_submissions 
SET status_submission = 'selesai', tanggal_verifikasi = NOW() 
WHERE id = 33678
```

**Root Cause:**
- Index corruption pada primary key `task_submissions_pkey`
- Biasanya disebabkan oleh: crash server, disk penuh, atau masalah hardware

## ✅ Solusi yang Diterapkan

### 1. Perbaikan Immediate (REINDEX)
```bash
node scripts/comprehensive-reindex.js
```

Script ini melakukan:
- ✅ REINDEX TABLE task_submissions (rebuild semua index)
- ✅ VACUUM FULL ANALYZE (cleanup menyeluruh)
- ✅ Verifikasi UPDATE operation
- ✅ Health check database

### 2. Hasil Perbaikan
```
Total rows: 21,012
Unique IDs: 21,012
Max ID: 26,367
Database size: 282 MB
Table size: 3.2 MB

Status: ✅ Berhasil diperbaiki
```

## 🔧 Script yang Tersedia

### A. **Aggressive Reindex** ⚡ (RECOMMENDED untuk Corruption Persisten)
```bash
node scripts/aggressive-reindex.js
```
**Kapan menggunakan:**
- Error "heap tid from index tuple" muncul BERULANG
- REINDEX biasa tidak berhasil
- Corruption sudah parah

**Yang dilakukan:**
- DROP & RECREATE primary key dari awal
- Kill koneksi idle dan transaksi menggantung
- VACUUM FULL cleanup total
- Rebuild semua index
- Verification test

**⚠️ WARNING:** Lock tabel sementara - gunakan saat traffic rendah

---

### B. **Comprehensive Reindex** (Untuk Corruption Sedang)
```bash
node scripts/comprehensive-reindex.js
```
**Yang dilakukan:**
- REINDEX TABLE semua index
- VACUUM FULL ANALYZE
- Health check database
- Verifikasi UPDATE operation

---

### C. **Database Health Monitor** (Untuk Prevention)
```bash
node scripts/monitor-db-health.js
```
**Cek:**
- Table bloat (dead tuples)
- Connection pool status
- Long-running queries
- Index health
- Disk usage

**Jalankan:** Setiap hari atau minggu untuk monitoring

---

### D. **Test UPDATE Query** (Untuk Verifikasi)
```bash
node scripts/test-update-query.js
```
**Kapan menggunakan:**
- Setelah menjalankan fix untuk verifikasi
- Test apakah corruption sudah hilang
- Simulasi exact query dari n8n workflow

**Output:**
- ✅ Success: Corruption sudah hilang
- ❌ Error: Masih ada masalah

---

### E. **Simple Reindex** (Quick Fix Ringan)
```bash
node scripts/run-reindex.js
```
Quick fix untuk corruption ringan (jarang berhasil untuk kasus parah)

## 📋 Checklist Pencegahan

### Harian:
- [ ] Monitor error logs di n8n workflow
- [ ] Cek notifikasi error dari database

### Mingguan:
- [ ] Jalankan `monitor-db-health.js`
- [ ] Review dead tuple percentage (harus < 20%)
- [ ] Cek disk space server

### Bulanan:
- [ ] VACUUM ANALYZE manual
- [ ] Review database performance
- [ ] Backup verification

## 🛠️ Troubleshooting

### Jika Error Masih Muncul Setelah REINDEX:

**⚠️ JIKA CORRUPTION PERSISTEN - Gunakan Aggressive Repair:**

```bash
node scripts/aggressive-reindex.js
```

**Script ini akan:**
1. Kill semua koneksi idle yang mengganggu
2. Cancel transaksi yang menggantung
3. VACUUM FULL untuk cleanup total
4. **DROP primary key constraint** (menghapus index corrupt)
5. **RECREATE primary key** (membuat index baru dari awal)
6. REBUILD semua index lainnya
7. ANALYZE dan verifikasi

**⚠️ WARNING:** Script ini akan **lock tabel** selama beberapa detik/menit.  
Jalankan saat traffic rendah.

---

### Alternatif Troubleshooting Lain:

1. **Cek Disk Space**
```bash
df -h
```
Pastikan masih ada space > 20%

2. **Cek Database Connections**
```bash
node scripts/monitor-db-health.js
```
Lihat apakah ada connection leak

3. **Manual VACUUM FULL**
```sql
VACUUM FULL ANALYZE task_submissions;
```

4. **Test UPDATE Query**
```bash
node scripts/test-update-query.js
```
Verifikasi apakah corruption sudah hilang

5. **Last Resort: Rebuild Table**
```sql
-- BACKUP dulu!
CREATE TABLE task_submissions_new AS SELECT * FROM task_submissions;
DROP TABLE task_submissions CASCADE;
ALTER TABLE task_submissions_new RENAME TO task_submissions;
-- Recreate indexes dan constraints
```

## 🔍 Prevention Best Practices

1. **Regular Maintenance**
   - Schedule VACUUM ANALYZE otomatis
   - Monitor table bloat
   - Reindex secara berkala

2. **Proper Shutdown**
   - Jangan kill -9 postgres process
   - Graceful shutdown saat maintenance

3. **Hardware**
   - Monitor disk health
   - Ensure adequate disk space
   - Use reliable storage (SSD recommended)

4. **Connection Pooling**
   - Set proper connection limits
   - Close connections properly
   - Avoid idle in transaction

## 📊 Monitoring Commands

### Check Table Size:
```sql
SELECT pg_size_pretty(pg_total_relation_size('task_submissions'));
```

### Check Dead Tuples:
```sql
SELECT n_live_tup, n_dead_tup, 
       ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_percent
FROM pg_stat_user_tables 
WHERE tablename = 'task_submissions';
```

### Check Index Bloat:
```sql
SELECT indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes 
WHERE relname = 'task_submissions';
```

## 📝 Log History

### 2026-03-06 11:48 WIB: CORRUPTION COMPLETELY FIXED
- **Issue:** Persistent index corruption pada task_submissions_pkey
- **Root Cause:** Index corruption yang tidak bisa diatasi dengan REINDEX biasa
- **Impact:** n8n workflow "VALIDASI TUGAS" gagal UPDATE status
- **Solution Applied:** 
  - ✅ AGGRESSIVE REPAIR: DROP & RECREATE primary key constraint
  - ✅ VACUUM FULL untuk cleanup total
  - ✅ REBUILD semua index dari awal
- **Verification:**
  - ✅ UPDATE test berhasil pada ID 26367
  - ✅ Stress test 5/5 queries berhasil
  - ✅ No errors detected
- **Status:** ✅✅✅ **COMPLETELY RESOLVED**
- **Next Action:** Monitor workflow dalam 24-48 jam

### 2026-03-06 11:35 WIB: Initial Attempt (Incomplete)
- **Issue:** task_submissions_pkey corrupted
- **Solution:** REINDEX TABLE + VACUUM FULL
- **Result:** ⚠️ Temporary fix - corruption returned
- **Lesson:** Corruption terlalu parah untuk REINDEX biasa

## 🔗 Related Files

- `/scripts/aggressive-reindex.js` - ⚡ **AGGRESSIVE FIX** - DROP & RECREATE (RECOMMENDED)
- `/scripts/test-update-query.js` - Test & verifikasi corruption sudah hilang
- `/scripts/comprehensive-reindex.js` - Perbaikan lengkap dengan REINDEX
- `/scripts/run-reindex.js` - Quick fix ringan
- `/scripts/monitor-db-health.js` - Health monitoring berkala
- `/scripts/fix-task-submissions-index.sql` - Manual SQL commands reference

## 📞 Escalation Path

Jika masalah persisten setelah semua langkah di atas:
1. Check server logs: `/var/log/postgresql/`
2. Contact database administrator
3. Consider hardware diagnostics
4. Review recent database changes
5. Consider migration to new server if hardware issue

---

**Last Updated:** 2026-03-06  
**Status:** ✅ Fixed & Monitoring
