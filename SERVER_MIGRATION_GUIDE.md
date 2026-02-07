# 🚀 Cloudinary to MinIO Migration - Server Execution Guide

## ⚠️ Masalah yang Ditemukan

**Nginx Reverse Proxy** mengubah S3 signature headers, sehingga upload dari local machine **GAGAL** dengan error:
```
SignatureDoesNotMatch: The request signature we calculated does not match the signature you provided
```

## ✅ Solusi: Jalankan di Server

Script harus dijalankan **DI SERVER** dimana bisa mengakses MinIO internal endpoint `drw-minio:9000` (bypass Nginx).

---

## 📋 Step-by-Step Migration

### 1️⃣ Upload Script ke Server

```bash
# Dari local machine (Windows PowerShell/Command Prompt)
scp C:\Users\akuci\OneDrive\Documents\berkomunitas\scripts\migrate-all-cloudinary-server.py root@213.190.4.159:/root/
```

Atau gunakan SFTP/WinSCP jika prefer GUI.

---

### 2️⃣ Login ke Server

```bash
ssh root@213.190.4.159
```

---

### 3️⃣ Install Dependencies (Jika Belum Ada)

```bash
# Install Python packages
pip3 install psycopg2-binary requests minio

# Atau jika pakai pip
pip install psycopg2-binary requests minio
```

---

### 4️⃣ Test dengan Dry Run

```bash
# Preview migration tanpa mengubah data
python3 /root/migrate-all-cloudinary-server.py --dry-run
```

**Expected Output:**
```
============================================================
🚀 CLOUDINARY TO MINIO MIGRATION (SERVER)
============================================================
📍 Using internal endpoint: drw-minio:9000
============================================================

📋 Fetching members with Cloudinary profile pictures...

📊 Found 27 members to migrate

🔍 DRY RUN MODE - No changes will be made

[9] DRW Skincare Official (drwcorpora@gmail.com)
    📥 Downloading from Cloudinary...
    ✅ Downloaded 43459 bytes
    🔍 [DRY RUN] Would upload as: 1770450xxx_hcpx4mardfsjeshbpdop.jpg

...

============================================================
📊 MIGRATION SUMMARY
============================================================
✅ Success: 24
❌ Errors:  3
📊 Total:   27
============================================================
```

**Note:** 3 errors adalah foto yang sudah dihapus dari Cloudinary (Member 17, 37, 61).

---

### 5️⃣ Jalankan Migration (LIVE MODE)

```bash
# Run actual migration
python3 /root/migrate-all-cloudinary-server.py
```

**Expected Output:**
```
⚠️  LIVE MODE - Changes will be permanent

[9] DRW Skincare Official (drwcorpora@gmail.com)
    📥 Downloading from Cloudinary...
    ✅ Downloaded 43459 bytes
    📤 Uploading to MinIO...
    ✅ Uploaded to: http://storage.berkomunitas.com/berkomunitas/profile-pictures/1770450xxx_...
    💾 Updating database...
    ✅ Database updated!

...

============================================================
📊 MIGRATION SUMMARY
============================================================
✅ Success: 24
❌ Errors:  3
📊 Total:   27
============================================================

✅ Migration complete!
   24 profile pictures migrated to MinIO
   Public URL: http://storage.berkomunitas.com/berkomunitas/profile-pictures/

🎉 ALL members successfully migrated to MinIO!
```

---

### 6️⃣ Verifikasi Migration

#### A. Check Status dengan Script

```bash
python3 /root/migrate-all-cloudinary-server.py --check
```

**Expected Output:**
```
📊 CLOUDINARY MIGRATION STATUS CHECK
============================================================
✅ No members using Cloudinary!
   All profile pictures have been migrated.
============================================================
```

#### B. Check Database Manual

```bash
# Login ke PostgreSQL
psql -h 213.190.4.159 -U berkomunitas -d berkomunitas_db

# Query members dengan Cloudinary
SELECT id, nama_lengkap, foto_profil_url 
FROM members 
WHERE foto_profil_url LIKE '%cloudinary.com%';

# Expected: 0 rows (atau hanya Member 17, 37, 61 yang fotonya sudah 404)

# Query members dengan MinIO
SELECT COUNT(*) 
FROM members 
WHERE foto_profil_url LIKE '%storage.berkomunitas.com%';

# Expected: 55+ members (31 existing + 24 migrated)

\q
```

#### C. Test Public URL Access

```bash
# Test salah satu URL yang baru di-migrate
curl -I http://storage.berkomunitas.com/berkomunitas/profile-pictures/1770450xxx_hcpx4mardfsjeshbpdop.jpg

# Expected: HTTP/1.1 200 OK
```

---

## 🔄 Rollback (Jika Diperlukan)

Jika migration gagal atau ada masalah:

```bash
# Dari local machine (sudah punya rollback script)
python scripts/rollback-to-cloudinary.py
```

Ini akan restore 27 members kembali ke Cloudinary URLs.

---

## 📊 Expected Final Distribution

Setelah migration berhasil:

| Source | Count | Percentage |
|--------|-------|------------|
| **MinIO** | **55** | **39.9%** |
| Google Photos | 61 | 44.2% |
| DiceBear | 45 | 32.6% |
| Cloudinary | **0** | **0%** ✅ |
| **Total** | **138** | **100%** |

**Breakdown MinIO:**
- 26 default avatars (generated sebelumnya)
- 5 fixed URLs (port 9100 → subdomain)
- 24 migrated dari Cloudinary
- **Total: 55 members**

---

## ❌ Troubleshooting

### Error: "No module named 'minio' atau 'psycopg2'"

```bash
pip3 install --upgrade psycopg2-binary requests minio boto3
```

### Error: "Connection refused to drw-minio:9000"

Script harus dijalankan **DI SERVER** dimana Docker container MinIO running. Tidak bisa dari local machine.

### Error: "Password authentication failed"

Check database credentials di script:
```python
DB_CONFIG = {
    'host': '213.190.4.159',
    'port': 5432,
    'database': 'berkomunitas_db',
    'user': 'berkomunitas',
    'password': 'berkomunitas688'
}
```

### Some Members Still Using Cloudinary After Migration

Check member IDs:
- Member 17, 37, 61: Foto sudah **404 di Cloudinary** (dihapus), perlu generate default avatar
- Member lainnya: Re-run migration script

Generate default avatar untuk yang 404:

```bash
python scripts/fix-missing-profile-pictures.py
```

---

## 💰 Cost Savings

Setelah ALL members migrated:

- **Cloudinary Free Tier**: 25 GB storage, 25 GB bandwidth/month
- **Current Usage**: ~30 photos, ~500 MB
- **Migration Benefit**: 
  - ✅ Unlimited storage di MinIO
  - ✅ Unlimited bandwidth
  - ✅ Full control over images
  - ✅ Faster access (same server)
  - ✅ No vendor lock-in

Jika sebelumnya pakai Cloudinary paid plan: **Save $89-$224+/year**

---

## 📝 Next Steps

1. ✅ Run migration di server
2. ✅ Verify all members migrated
3. ✅ Test public URL access
4. ✅ Generate default avatars untuk Member 17, 37, 61
5. ⏳ Monitor MinIO disk usage
6. ⏳ Backup Cloudinary photos (download originals) sebelum delete account
7. ⏳ Cancel/downgrade Cloudinary subscription (after 1-2 weeks stable)
8. ⏳ Remove Cloudinary fallback dari lib/storage.js
9. ⏳ Update documentation

---

## 🎉 Success Criteria

Migration dianggap **BERHASIL** jika:

✅ 24+ members berhasil di-migrate dari Cloudinary ke MinIO  
✅ 0 members masih pakai Cloudinary URLs (except yang 404)  
✅ All MinIO URLs accessible (HTTP 200 OK)  
✅ Database updated dengan MinIO URLs  
✅ Upload functionality masih berfungsi normal dari aplikasi

---

**Created:** 2026-02-07  
**Author:** Copilot Assistant  
**Status:** Ready for Server Execution
