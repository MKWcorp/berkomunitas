# 📸 Upload Foto Profil - Setup Guide

## 🚨 Masalah Vercel Production

**Error yang terjadi:**
```
EROFS: read-only file system, open '/var/task/public/uploads/profile_1754759038319.png'
```

**Root Cause:** Vercel menggunakan read-only filesystem di production, tidak bisa menyimpan file ke `/public/uploads/`

## ✅ Solusi: Cloud Storage (Cloudinary)

### 🔧 Setup Cloudinary

1. **Daftar akun Cloudinary gratis** di [cloudinary.com](https://cloudinary.com)

2. **Dapatkan credentials dari Dashboard:**
   - Cloud Name
   - API Key  
   - API Secret

3. **Buat Upload Preset:**
   - Masuk ke Settings → Upload
   - Scroll ke "Upload presets"
   - Klik "Add upload preset"
   - Nama: `komunitas_profiles`
   - Mode: `Unsigned` (untuk kemudahan)
   - Folder: `profile-pictures`
   - Save

4. **Set Environment Variables:**

### Development (.env)
```env
# Cloudinary (Profile Picture Upload)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=komunitas_profiles
```

### Production (Vercel)
```bash
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY  
vercel env add CLOUDINARY_API_SECRET
vercel env add CLOUDINARY_UPLOAD_PRESET
```

## 🔧 Fitur Smart Upload

Kode sudah diupdate dengan fallback logic:

### Production:
- ✅ **Primary:** Cloudinary upload
- ❌ **Fallback:** Error jika Cloudinary tidak dikonfigurasi

### Development:
- ✅ **Primary:** Local file storage (`/public/uploads/`)
- ✅ **Fallback:** Cloudinary jika local storage gagal

## 🎯 Fitur Upload

### Validasi:
- ✅ File types: JPEG, PNG, GIF, WebP
- ✅ Max size: 5MB
- ✅ Auto-resize: 400x400px dengan crop face detection
- ✅ Auto-optimization: quality & format

### URL yang dihasilkan:
```
Development: /uploads/profile_1754759038319.png
Production: https://res.cloudinary.com/your-cloud/image/upload/v1754759038/profile-pictures/abc123.jpg
```

## 🚀 Deployment Steps

1. **Setup Cloudinary** (lihat di atas)
2. **Add environment variables** ke Vercel
3. **Deploy** - upload foto seharusnya bekerja
4. **Test** upload foto di production

## 🔍 Troubleshooting

### Error: "Cloud storage must be configured"
- Pastikan `CLOUDINARY_CLOUD_NAME` sudah di-set di Vercel environment variables
- Redeploy setelah menambahkan env vars

### Error: "Cloudinary upload failed" 
- Cek `CLOUDINARY_API_KEY` dan `CLOUDINARY_API_SECRET`
- Pastikan upload preset `komunitas_profiles` sudah dibuat dan mode `Unsigned`

### Development: "Local storage not available"
- Pastikan folder `public/uploads/` ada dan writable
- Atau set Cloudinary env vars untuk development juga

## 📝 Alternative Solutions

Jika tidak ingin menggunakan Cloudinary, opsi lain:

1. **Vercel Blob Storage** (berbayar)
2. **AWS S3** (setup lebih kompleks)
3. **Supabase Storage** (gratis tier tersedia)
4. **Firebase Storage** (Google, gratis tier)

Cloudinary dipilih karena:
- ✅ Gratis tier yang generous
- ✅ Auto-optimization built-in
- ✅ Face detection untuk crop
- ✅ CDN global
- ✅ Easy setup
