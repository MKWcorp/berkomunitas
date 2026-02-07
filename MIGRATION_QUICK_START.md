# Quick Start: MinIO Migration (Server Team)

**TL;DR:** Migration script perlu run DI SERVER karena port 9000 hanya accessible via internal Docker network.

---

## 🚀 Quick Setup (5 commands)

```bash
# 1. Upload script (akan dikirim via email/chat)
# File: migrate-cloudinary-to-minio-server.py
# Save to: /root/migrate-cloudinary-to-minio-server.py

# 2. SSH to server
ssh root@213.190.4.159

# 3. Install dependencies (one-time)
pip3 install boto3 requests psycopg2-binary

# 4. Test with dry run
python3 /root/migrate-cloudinary-to-minio-server.py --dry-run

# 5. Run actual migration
python3 /root/migrate-cloudinary-to-minio-server.py
```

---

## ✅ Expected Output

```
🚀 Starting Cloudinary to MinIO Migration (Server-Side)
Mode: ✅ LIVE MODE

📡 MinIO Endpoint: drw-minio:9000
📦 Bucket: berkomunitas
🔗 Public URL: http://storage.berkomunitas.com/berkomunitas

📊 Fetching members with Cloudinary images...
Found 27 members with Cloudinary images

📸 Processing: 138 - User Name
   Old URL: https://res.cloudinary.com/...
   ⬇️  Downloading from Cloudinary... ✅ (145678 bytes)
   ⬆️  Uploading to MinIO... ✅
   💾 Updating database... ✅
   New URL: http://storage.berkomunitas.com/.../migrated_138_*.jpg
   ✅ Success!

[... continues for 27 members ...]

═══════════════════════════════════════════════════════════
📊 Migration Summary
═══════════════════════════════════════════════════════════
✅ Success: 24
❌ Errors: 3 (Cloudinary files deleted)
📊 Total: 27

✅ Migration Complete!

🔍 Verify uploaded files:
   docker exec drw-minio mc ls local/berkomunitas/profile-pictures/

🌐 Test public access:
   curl -I http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_138_*
```

---

## 🔍 Verify After Migration

```bash
# Check files uploaded
docker exec drw-minio mc ls local/berkomunitas/profile-pictures/ | grep migrated_

# Should show 24 files:
# [2026-02-07 14:30:00 WIB] 145678 migrated_138_1770450000000.jpg
# [2026-02-07 14:30:01 WIB] 234567 migrated_222_1770450001000.jpg
# ... (24 files total)

# Test public access
curl -I http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_138_1770450000000.jpg
# Expected: HTTP 200 OK

# Test download
curl http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_138_1770450000000.jpg --output test.jpg
file test.jpg
# Expected: test.jpg: JPEG image data
```

---

## ⚠️ Troubleshooting

### Error: `ModuleNotFoundError: No module named 'boto3'`

```bash
# Install dependencies
pip3 install boto3 requests psycopg2-binary

# If pip3 not found
python3 -m pip install boto3 requests psycopg2-binary

# Or use python2 pip
pip install boto3 requests psycopg2-binary
```

### Error: `Connection refused to drw-minio:9000`

```bash
# Check if container running
docker ps | grep drw-minio

# Check Docker network
docker network inspect webproxy | grep drw-minio

# Try pinging from another container
docker exec nginx-proxy ping drw-minio -c 3
```

### Error: `Database connection failed`

```bash
# Check if database accessible
psql -h 213.190.4.159 -U berkomunitas -d berkomunitas_db -c "SELECT 1;"

# If password prompt, password is: berkomunitas688
```

### Script Hangs or Slow

```bash
# Run in background with log
nohup python3 /root/migrate-cloudinary-to-minio-server.py > /root/migration.log 2>&1 &

# Monitor progress
tail -f /root/migration.log

# Check if running
ps aux | grep migrate-cloudinary
```

---

## 🔄 Rollback (If Needed)

```bash
# Script doesn't delete old Cloudinary URLs
# Database can be reverted with:

# 1. Stop migration (if running)
pkill -f migrate-cloudinary

# 2. Check affected members
psql -h 213.190.4.159 -U berkomunitas -d berkomunitas_db -c \
  "SELECT id, foto_profil_url FROM members WHERE foto_profil_url LIKE '%storage.berkomunitas.com%';"

# 3. Restore from backup (if available)
# Or application will auto-fallback to Cloudinary
```

---

## 📞 Contact

**If you encounter issues:**

1. Share the error message + full log output
2. Run verification commands above
3. Share results

**Application Team:** [Will provide contact]  
**Response Time:** Within 1 hour during business hours

---

## ✅ Post-Migration Checklist

- [ ] Migration completed successfully (24+ files)
- [ ] Files visible in MinIO: `docker exec drw-minio mc ls local/berkomunitas/profile-pictures/`
- [ ] Public URL test passed: `curl -I http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_*`
- [ ] Database updated (can verify with: `psql ... "SELECT ... WHERE foto_profil_url LIKE '%storage.berkomunitas.com%';"`)
- [ ] Notified application team of completion
- [ ] Application team verified images display in web app

---

**Estimated Time:** 25-30 minutes total  
**Risk Level:** LOW (dry-run available, can rollback)  
**Priority:** HIGH (blocks production deployment)

**Thank you for your support! 🙏**
