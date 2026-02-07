# 🚀 Vercel Environment Variables

## ⚠️ IMPORTANT: MinIO Endpoint

Vercel berjalan **di luar server Docker network**, jadi **HARUS** pakai public subdomain, **BUKAN** internal endpoint!

## 📋 Environment Variables untuk Vercel

Tambahkan semua ini di **Vercel Dashboard** → Project Settings → Environment Variables:

---

### 1️⃣ Database (PostgreSQL)

```bash
DATABASE_URL="postgresql://berkomunitas:berkomunitas688@213.190.4.159:5432/berkomunitas_db?schema=public"
```

---

### 2️⃣ MinIO Object Storage (PRODUCTION)

**⚠️ CRITICAL: Pakai storage.berkomunitas.com (public), BUKAN drw-minio:9000 (internal)**

```bash
# MinIO S3 API Endpoint (PUBLIC SUBDOMAIN)
MINIO_ENDPOINT=storage.berkomunitas.com

# MinIO Credentials
MINIO_ACCESS_KEY=drwcorp
MINIO_SECRET_KEY=Rahasiakita.88

# MinIO Bucket
MINIO_BUCKET=berkomunitas

# MinIO Region
MINIO_REGION=us-east-1

# SSL Setting (false karena pakai http://)
MINIO_USE_SSL=false

# Public URL untuk browser/client access
MINIO_PUBLIC_URL=http://storage.berkomunitas.com/berkomunitas
```

---

### 3️⃣ Alternative S3 Format (Optional - Jika pakai lib lain)

```bash
S3_ENDPOINT=http://storage.berkomunitas.com
S3_ACCESS_KEY_ID=drwcorp
S3_SECRET_ACCESS_KEY=Rahasiakita.88
S3_BUCKET=berkomunitas
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_URL=http://storage.berkomunitas.com
```

---

### 4️⃣ Cloudinary (Optional - Fallback Aja)

Jika masih mau keep Cloudinary sebagai fallback:

```bash
CLOUDINARY_CLOUD_NAME=dmzx6aigr
CLOUDINARY_API_KEY=142548883246277
CLOUDINARY_API_SECRET=7PU_0HEAxwAHTXDBSecKSKcNIBs
CLOUDINARY_UPLOAD_PRESET=komunitas_profiles
```

---

### 5️⃣ SSO Authentication (Jika pakai)

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Session Secret
SESSION_SECRET=your_session_secret_key_here
```

---

## 🔧 Cara Menambahkan di Vercel

### Via Vercel Dashboard (Recommended):

1. Buka [vercel.com](https://vercel.com)
2. Pilih project **berkomunitas**
3. Go to **Settings** → **Environment Variables**
4. Untuk setiap variable:
   - Klik **Add New**
   - Name: `MINIO_ENDPOINT`
   - Value: `storage.berkomunitas.com`
   - Environment: Pilih **Production**, **Preview**, **Development** (all)
   - Klik **Save**
5. Ulangi untuk semua variables di atas

### Via Vercel CLI:

```bash
# Install Vercel CLI (jika belum)
npm install -g vercel

# Login
vercel login

# Link project (di folder project)
vercel link

# Add environment variables
vercel env add MINIO_ENDPOINT production
# Paste value: storage.berkomunitas.com

vercel env add MINIO_ACCESS_KEY production
# Paste value: drwcorp

vercel env add MINIO_SECRET_KEY production
# Paste value: Rahasiakita.88

vercel env add MINIO_BUCKET production
# Paste value: berkomunitas

vercel env add MINIO_REGION production
# Paste value: us-east-1

vercel env add MINIO_USE_SSL production
# Paste value: false

vercel env add MINIO_PUBLIC_URL production
# Paste value: http://storage.berkomunitas.com/berkomunitas

vercel env add DATABASE_URL production
# Paste value: postgresql://berkomunitas:berkomunitas688@213.190.4.159:5432/berkomunitas_db?schema=public
```

---

## ✅ Verification After Deployment

Setelah deploy, test upload foto profil:

1. Login ke aplikasi di Vercel
2. Upload foto profil
3. Check logs: `vercel logs <deployment-url>`
4. Verify foto accessible: `http://storage.berkomunitas.com/berkomunitas/profile-pictures/...`

---

## 🚨 Troubleshooting

### Error: "Could not connect to drw-minio:9000"
**Problem:** Masih pakai internal endpoint  
**Solution:** Ganti `MINIO_ENDPOINT` ke `storage.berkomunitas.com`

### Error: "SignatureDoesNotMatch"
**Problem:** Credentials salah atau endpoint issue  
**Solution:** 
- Check `MINIO_ACCESS_KEY` = `drwcorp`
- Check `MINIO_SECRET_KEY` = `Rahasiakita.88`
- Pastikan pakai endpoint public (storage.berkomunitas.com)

### Upload Success tapi Foto 404
**Problem:** Public URL salah  
**Solution:** Check `MINIO_PUBLIC_URL` = `http://storage.berkomunitas.com/berkomunitas`

---

## 📊 Summary

**CRITICAL CHANGES untuk Vercel:**

| Variable | Local (.env) | Vercel (Production) |
|----------|-------------|-------------------|
| `MINIO_ENDPOINT` | `drw-minio:9000` | **`storage.berkomunitas.com`** ✅ |
| `MINIO_PUBLIC_URL` | Same | Same |
| `DATABASE_URL` | Same | Same |

**Why?** Vercel berjalan di cloud, tidak bisa akses internal Docker network `drw-minio:9000`. Harus pakai public subdomain `storage.berkomunitas.com` yang accessible dari internet via Nginx.

---

**Created:** 2026-02-07  
**Status:** Ready for Vercel Deployment
