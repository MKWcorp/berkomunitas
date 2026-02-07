# Migrate Last Cloudinary Photo to MinIO

**Target:** Member 11 (M K Wiro) - Last remaining Cloudinary user  
**From:** https://res.cloudinary.com/dmzx6aigr/...  
**To:** http://storage.berkomunitas.com/berkomunitas/profile-pictures/...

---

## 🚀 Quick Start

### Step 1: Upload Script to Server

```bash
# From your laptop
scp scripts/migrate-last-cloudinary-photo.py root@213.190.4.159:/root/
```

### Step 2: SSH to Server

```bash
ssh root@213.190.4.159
```

### Step 3: Install Dependencies (if not already installed)

```bash
pip3 install boto3 requests psycopg2-binary
```

### Step 4: Test with Dry Run

```bash
python3 /root/migrate-last-cloudinary-photo.py --dry-run
```

**Expected output:**
```
🔄 Migrate Cloudinary Photo to MinIO
============================================================
Mode: 🧪 DRY RUN

📊 Finding members using Cloudinary...

Found 1 member(s) using Cloudinary

============================================================

📸 Migrating Member 11: M K Wiro
  Old URL: https://res.cloudinary.com/dmzx6aigr/image/upload/v1770447961/profile-...
  🧪 DRY RUN - Skipping actual migration

💾 Updating database...
  🧪 DRY RUN - Would update member 11
  New URL: (would be generated)

============================================================
📊 Migration Summary
============================================================
Total members: 1
Would migrate: 1

💡 Run without --dry-run to perform actual migration
```

### Step 5: Run Actual Migration

```bash
python3 /root/migrate-last-cloudinary-photo.py
```

**Expected output:**
```
🔄 Migrate Cloudinary Photo to MinIO
============================================================
Mode: ✅ LIVE MODE

📊 Finding members using Cloudinary...

Found 1 member(s) using Cloudinary

============================================================

📸 Migrating Member 11: M K Wiro
  Old URL: https://res.cloudinary.com/dmzx6aigr/...
  ⬇️  Downloading from Cloudinary...
  ✅ Downloaded (145678 bytes)
  ⬆️  Uploading to MinIO...
  ✅ Uploaded to MinIO
  📎 http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_11_1707349876543.jpg
  ✅ Migration successful!

💾 Updating database...
  ✅ Database updated

============================================================
📊 Migration Summary
============================================================
Total members: 1
✅ Migrated: 1
❌ Failed: 0

🎉 Migration complete!
```

---

## 🔍 Verify Migration

### Check File in MinIO

```bash
docker exec drw-minio mc ls local/berkomunitas/profile-pictures/ | grep migrated_11
```

**Expected:** Shows the newly uploaded file

### Test Public URL

```bash
# Replace timestamp with actual value from migration output
curl -I http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_11_1707349876543.jpg
```

**Expected:** HTTP 200 OK

### Check Database

```bash
psql -h 213.190.4.159 -U berkomunitas -d berkomunitas_db -c \
  "SELECT id, nama_lengkap, foto_profil_url FROM members WHERE id = 11;"
```

**Expected:** URL should now be storage.berkomunitas.com

---

## 🌐 Test in Application

1. Open: https://berkomunitas.com (or http://localhost:3000)
2. Login as Member 11
3. Go to profile page
4. Photo should display correctly from MinIO storage

---

## 📊 Final Status After Migration

Before:
- Cloudinary: 1 member
- MinIO: 31 members

After:
- **Cloudinary: 0 members** ✅
- **MinIO: 32 members** ✅
- **100% migrated to self-hosted storage!** 🎉

---

## 💰 Cost Savings

After this migration:
- ❌ No more Cloudinary subscription needed
- ✅ Can cancel Cloudinary account (save $89+/month)
- ✅ Total savings: $1,068+/year

---

## 🔄 Rollback (if needed)

If something goes wrong:

```bash
# SSH to server
ssh root@213.190.4.159

# Rollback database
psql -h 213.190.4.159 -U berkomunitas -d berkomunitas_db -c \
  "UPDATE members SET foto_profil_url = 'https://res.cloudinary.com/dmzx6aigr/image/upload/v1770447961/profile-pictures/member-11.jpg' WHERE id = 11;"
```

**Note:** Keep Cloudinary account active for a few days in case rollback needed!

---

## ✅ Checklist

- [ ] Upload script to server
- [ ] Install Python dependencies
- [ ] Run dry-run test
- [ ] Run actual migration
- [ ] Verify file in MinIO
- [ ] Test public URL access
- [ ] Check database updated
- [ ] Test in web application
- [ ] Profile photo displays correctly
- [ ] Keep Cloudinary active for 7 days (safety)
- [ ] After 7 days: Cancel Cloudinary subscription

---

**Estimated time:** 10 minutes  
**Risk:** LOW (can rollback easily)  
**Savings:** $89/month = $1,068/year 💰

🚀 Ready to migrate!
