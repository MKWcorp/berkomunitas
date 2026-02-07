# 🚀 Quick Migration Guide - CASCADE DELETE FIX

## ✅ SAFE MIGRATION - Zero Data Loss - Zero Downtime

### 📋 Pre-Requisites
- [ ] Database credentials ready
- [ ] psql installed (atau bisa akses database via GUI tool)
- [ ] Read [CASCADE_DELETE_FIX.md](CASCADE_DELETE_FIX.md) untuk detail lengkap

### 🎯 One-Command Migration

```bash
# Replace dengan credential Anda
psql -h 213.190.4.159 -U your_username -d your_database \
  -f prisma/migrations/add_cascade_delete_missing_tables.sql
```

### 📊 Expected Output

✅ **Success:**
```
NOTICE:  SUCCESS: All 3 CASCADE constraints created successfully!
```

⚠️ **Warning (OK to proceed):**
```
NOTICE:  WARNING: Found orphaned records in task_submissions
```
(Ini hanya info, migration tetap jalan dan aman)

❌ **Error (Auto Rollback):**
```
ERROR:  ...
```
(Tidak ada perubahan, database tetap sama)

### 🔍 Verify Migration

```sql
-- Quick check: Should show 3 rows with CASCADE
SELECT table_name, delete_rule 
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name IN ('task_submissions', 'reward_redemptions', 'member_transactions')
  AND tc.constraint_type = 'FOREIGN KEY';
```

### 🧪 Test Migration

```sql
-- 1. Create test member
INSERT INTO members (nama_lengkap, email) 
VALUES ('Test User', 'test@example.com') 
RETURNING id;

-- Say we got id = 99999

-- 2. Create test data
INSERT INTO task_submissions (id_task, id_member, status_submission)
VALUES (1, 99999, 'selesai');

-- 3. Delete member (should cascade delete task_submission)
DELETE FROM members WHERE id = 99999;

-- 4. Verify cascade worked (should return 0)
SELECT COUNT(*) FROM task_submissions WHERE id_member = 99999;
```

### 🔄 Rollback (If Needed)

```bash
# Kembalikan ke NO ACTION behavior
psql -h 213.190.4.159 -U your_username -d your_database \
  -f prisma/migrations/rollback_cascade_delete.sql
```

### ⏱️ Timeline

| Step | Duration | Risk |
|------|----------|------|
| Pre-check | < 1s | None |
| Migration | < 2s | None (auto rollback on error) |
| Verification | < 1s | None |
| **Total** | **< 5s** | **Zero downtime** |

### 📝 What Changed

- ❌ **TIDAK berubah:** Data yang sudah ada
- ❌ **TIDAK berubah:** Struktur tabel
- ✅ **BERUBAH:** Foreign key constraint (NO ACTION → CASCADE)
- ✅ **Effect:** Member deletion NOW cleans up all related data

### 💡 Tips

1. **Best Time to Migrate:** Anytime (zero downtime)
2. **Backup Needed?** Optional (migration is safe, but backup is always good practice)
3. **Application Restart?** No
4. **Database Restart?** No

### ❓ Quick FAQ

**Q: Will existing data be deleted?**
A: NO. Only affects future deletions.

**Q: Can I rollback?**
A: YES. Run [rollback_cascade_delete.sql](prisma/migrations/rollback_cascade_delete.sql)

**Q: How long does it take?**
A: < 5 seconds

**Q: Do I need to stop my app?**
A: NO. Zero downtime.

**Q: What if it fails?**
A: Auto rollback. No changes made.

### 🎬 Video Script (untuk dokumentasi)

```
1. SSH to server (or open psql locally)
2. cd /path/to/berkomunitas
3. psql -h ... -U ... -d ... -f prisma/migrations/add_cascade_delete_missing_tables.sql
4. See "SUCCESS" message
5. Done! Test by creating & deleting a test member
```

### 📞 Need Help?

- Read full docs: [CASCADE_DELETE_FIX.md](CASCADE_DELETE_FIX.md)
- Check rollback script: [rollback_cascade_delete.sql](prisma/migrations/rollback_cascade_delete.sql)
- Migration script: [add_cascade_delete_missing_tables.sql](prisma/migrations/add_cascade_delete_missing_tables.sql)
