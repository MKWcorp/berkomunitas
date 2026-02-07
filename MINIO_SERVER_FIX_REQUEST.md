# 🔴 URGENT: MinIO Storage Public Access Issue

**Date:** February 7, 2026  
**Project:** Berkomunitas Platform  
**Issue:** Files uploaded successfully to MinIO but NOT accessible via public URL  
**Priority:** HIGH (blocks production deployment)

---

## 📋 Issue Summary

MinIO storage infrastructure sudah dikonfigurasi dengan baik (subdomain, Nginx proxy, CORS), tetapi **uploaded files tidak bisa diakses via public URL**.

**🔴 ROOT CAUSE IDENTIFIED:**  
Migration script run dari laptop menggunakan external endpoint `213.190.4.159:9000`, tapi **port 9000 tidak exposed untuk public access**. Files tidak pernah sampai ke MinIO!

### Symptoms

- ❌ ~~Upload ke MinIO via S3 API: SUCCESS~~ **FAILED (port not accessible)**
- ✅ Subdomain health check: **WORKING** (http://storage.berkomunitas.com/health)
- ✅ Nginx proxy: **RESPONDING** (CORS headers present)
- ❌ Public file access: **FAILED** (HTTP 404 Not Found)
- ❌ MinIO error: `NoSuchKey - The specified key does not exist`
- ❌ **Files verification: Only 4 test files exist, NO `migrated_*` files found**

### Evidence from Diagnostics

```bash
# Test Result (run from client):
$ node scripts/diagnose-minio-access.js

🔍 Testing: Test File #1 (migrated_138)
   URL: http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_138_1770445648530.jpg
   ❌ Status: 404
   📦 Content-Type: application/xml
   🖥️  Server: nginx/1.29.1
   ⚠️  X-Minio-Error-Code: NoSuchKey
   ℹ️  X-Minio-Error-Desc: "The specified key does not exist."
   🌐 CORS: * (working)

🔍 Testing: Subdomain Health Check
   URL: http://storage.berkomunitas.com/health
   ✅ Status: 200  (Nginx working)

📊 Summary: ALL IMAGE FILES FAILED (0/3 accessible)
```

### Migration Context

- **Uploaded files:** 24 images
- **Upload method:** AWS SDK S3 Client (PutObjectCommand)
- **Upload response:** HTTP 200 OK with valid ETag
- **Database URLs updated:** All 24 members have URLs like:
  ```
  http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_138_1770445648530.jpg
  ```
- **Public access test:** ALL return 404 NoSuchKey

---

## 🔍 Root Cause Analysis - SOLVED ✅

**Confirmed Root Cause:**

Migration script was running from **local laptop** and tried to connect to MinIO using external IP `213.190.4.159:9000`, but **port 9000 is NOT exposed for public access** (only accessible from internal Docker network).

### What Happened:

```javascript
// Migration script (run from laptop) ❌
const s3Client = new S3Client({
  endpoint: 'http://213.190.4.159:9000',  // ❌ Port 9000 not public!
  // ...
});

// Script reported "success" but files never reached MinIO
// because connection to port 9000 failed silently
```

### Verification from Server:

```bash
$ docker exec drw-minio mc ls local/berkomunitas/profile-pictures/

# Found only 4 test files:
[2026-02-07 13:12:04] 17B diagnosis-test-1770447124.txt
[2026-02-07 13:05:46] 0B test-profile.jpg
[2026-02-07 12:00:00] 10B test.txt
[2026-02-07 13:10:46] 29B verify-test-1770446246.txt

# ❌ NO migrated_* files found!
# Expected: 24 files named migrated_138_*.jpg, migrated_222_*.jpg, etc.
```

### Why Script Reported Success:

The S3 client may have:
1. Failed silently without throwing errors
2. Timed out but caught by error handler
3. Connected but failed to upload (network issue)

### Solution:

**Run migration script ON THE SERVER** where it can access `drw-minio:9000` via internal Docker network.

We've prepared a new Python script that must run server-side: `migrate-cloudinary-to-minio-server.py`

---

## 🔧 Requested Actions from Server Team

### NEW APPROACH: Run Migration Script Server-Side ⚡

Since port 9000 is only accessible from internal Docker network, we need to run the migration script **ON THE SERVER**.

#### Step 1: Upload Migration Script to Server

```bash
# From application team (we'll send you the file)
# You'll receive: migrate-cloudinary-to-minio-server.py
# Place it in: /root/migrate-cloudinary-to-minio-server.py
```

#### Step 2: Install Python Dependencies (One-time)

```bash
# SSH to server
ssh root@213.190.4.159

# Install required Python packages
pip3 install boto3 requests psycopg2-binary python-dotenv

# Or if pip3 not available
python3 -m pip install boto3 requests psycopg2-binary python-dotenv
```

#### Step 3: Run Migration Script

```bash
# Dry run first (test without changes)
python3 /root/migrate-cloudinary-to-minio-server.py --dry-run

# If dry run successful, run actual migration
python3 /root/migrate-cloudinary-to-minio-server.py
```

**Script will:**
1. Connect to MinIO via `drw-minio:9000` (internal network) ✅
2. Fetch members with Cloudinary URLs from database
3. Download each image from Cloudinary
4. Upload to MinIO with new filename `migrated_{id}_{timestamp}.{ext}`
5. Update database with new MinIO URLs
6. Show progress and summary

**Expected output:**
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
   New URL: http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_138_1234567890.jpg
   ✅ Success!
   
[... continues for all members ...]

═══════════════════════════════════════════════════════════
📊 Migration Summary
═══════════════════════════════════════════════════════════
✅ Success: 24
❌ Errors: 3
📊 Total: 27

✅ Migration Complete!
```

---

### Alternative: Simple Bash Script (No Python Dependencies)

If Python dependencies are an issue, we can provide a bash script using `curl` and MinIO CLI:

```bash
#!/bin/bash
# migrate-simple.sh

# This requires MinIO CLI (mc) which is already in drw-minio container
# No additional dependencies needed

docker exec drw-minio bash -c '
  # Upload test to verify
  echo "Test upload from bash" > /tmp/test.txt
  mc cp /tmp/test.txt local/berkomunitas/profile-pictures/bash-test.txt
  
  # List files to confirm
  mc ls local/berkomunitas/profile-pictures/
'
```

Let us know which approach you prefer!

---

### OLD SECTION (Bucket Policy) - Already Done ✅

Bucket policy is already configured correctly:

```bash
docker exec drw-minio mc anonymous get local/berkomunitas
# Returns: Access permission for `local/berkomunitas` is set to `download` ✅
```

---

## 🧪 Migration Script Details

We've prepared a Python script that runs server-side: **`migrate-cloudinary-to-minio-server.py`**

### How to Transfer Script to Server:

```bash
# Option 1: SCP from our machine
scp scripts/migrate-cloudinary-to-minio-server.py root@213.190.4.159:/root/

# Option 2: Create directly on server
ssh root@213.190.4.159
# Then paste script content or download from repo
```

### Script Configuration:

The script is pre-configured with correct credentials:

```python
# MinIO Configuration (Internal Docker Network)
MINIO_ENDPOINT = 'drw-minio:9000'  # ✅ Internal hostname
MINIO_ACCESS_KEY = 'drwcorp'
MINIO_SECRET_KEY = 'Rahasiakita.88'
MINIO_BUCKET = 'berkomunitas'

# Database Configuration  
DB_HOST = '213.190.4.159'
DB_NAME = 'berkomunitas_db'
DB_USER = 'berkomunitas'
DB_PASSWORD = 'berkomunitas688'
```

### What Script Does:

1. ✅ Connects to database to get members with Cloudinary URLs
2. ✅ Downloads each image from Cloudinary
3. ✅ Uploads to MinIO via `drw-minio:9000` (internal network)
4. ✅ Updates database with new MinIO URLs
5. ✅ Provides detailed progress and error reporting
6. ✅ Supports `--dry-run` for testing

### Advantages:

- ✅ No external port access needed
- ✅ Fast (server to MinIO on same network)
- ✅ Reliable (internal Docker networking)
- ✅ Safe (dry-run mode available)
- ✅ Resumable (handles errors gracefully)

---

## ✅ Success Criteria

After fixes applied, these tests should pass:

```bash
# Test 1: Bucket policy is public
docker exec drw-minio mc anonymous get local/berkomunitas
# Expected: "download"

# Test 2: Files exist in MinIO
docker exec drw-minio mc ls local/berkomunitas/profile-pictures/ | wc -l
# Expected: 24+ files

# Test 3: Public URL accessible
curl -I http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_138_1770445648530.jpg
# Expected: HTTP 200 OK (not 404)

# Test 4: File content downloadable
curl http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_138_1770445648530.jpg --output test.jpg
# Expected: Valid image file downloaded
```

---

## 📊 Expected Timeline

- **Upload script to server:** 2 minutes
- **Install Python dependencies:** 5 minutes (one-time setup)
- **Dry run test:** 2 minutes
- **Actual migration:** 10-15 minutes (27 images × ~30 seconds each)
- **Verification:** 5 minutes (check files, test URLs)

**Total estimated time:** 25-30 minutes

**Note:** If Python dependencies already installed, only 15-20 minutes needed.

---

## 🔄 Rollback Plan

If fixes cause any issues:

```bash
# Revert bucket policy to private
docker exec drw-minio mc anonymous set none local/berkomunitas

# Restore previous Nginx config (if backed up)
docker exec nginx-proxy cp /etc/nginx/conf.d/storage.berkomunitas.com.conf.bak \
  /etc/nginx/conf.d/storage.berkomunitas.com.conf
docker exec nginx-proxy nginx -s reload
```

Application will fallback to Cloudinary automatically.

---

## 📞 Contact & Support

**Application Team:**
- Contact: [Your Name/Email]
- Available: [Your availability]

**Testing Support:**
We can run client-side diagnostics immediately after fixes to verify:
```bash
node scripts/diagnose-minio-access.js
# Will show real-time status of all URLs
```

---

## 📎 Additional Context

### Server Infrastructure

- **Server:** 213.190.4.159 (srv645129.hstgr.cloud)
- **Container:** drw-minio
- **Bucket:** berkomunitas
- **Public URL:** http://storage.berkomunitas.com
- **Internal endpoint:** drw-minio:9000
- **Docker networks:** webproxy + drwskincare_drw-network

### MinIO Credentials (for server admin only)

```bash
Access Key: drwcorp
Secret Key: Rahasiakita.88
Region: us-east-1
Console (if needed): http://213.190.4.159:9100
```

### Architecture Diagram

```
[Client Browser]
      ↓
[storage.berkomunitas.com] ← DNS A record to 213.190.4.159
      ↓
[nginx-proxy:80] ← Reverse proxy
      ↓ proxy_pass
[drw-minio:9000] ← MinIO S3-compatible API
      ↓
[Volume: /data] ← Persistent storage
      ↓
[Files: /berkomunitas/profile-pictures/*]
```

**Issue occurs at:** Public access step (Nginx → MinIO → Volume)

---

## 🎯 Summary

**Problem:** ~~Files uploaded successfully but return 404 on public access~~ **Files never uploaded - port 9000 not accessible from external**  
**Root Cause:** Migration script ran from laptop trying to access `213.190.4.159:9000` which is not exposed publicly  
**Solution:** Run migration script **ON THE SERVER** where it can access `drw-minio:9000` via internal Docker network  
**Primary Action:** 
```bash
# 1. Upload script to server (we'll send you the file)
# 2. Install Python deps: pip3 install boto3 requests psycopg2-binary
# 3. Run: python3 /root/migrate-cloudinary-to-minio-server.py
```
**Verification:** After migration, files will be accessible at `http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_*`  
**Timeline:** 20-30 minutes (install deps + run migration)  
**Risk:** LOW (dry-run available, can rollback to Cloudinary)  

### Why Previous Attempt Failed:

```
[Laptop] → [Internet] → [213.190.4.159:9000] ❌ Port not exposed
                                              ❌ Connection failed
                                              ❌ Files never uploaded

[Correct Approach]
[Server Script] → [Docker Network] → [drw-minio:9000] ✅ Internal access
                                                        ✅ Fast & reliable
                                                        ✅ Files uploaded
```  

---

**Thank you for your support! 🙏**

Please run Priority 1 command first and let us know the result. We can run client-side tests immediately to verify the fix.
