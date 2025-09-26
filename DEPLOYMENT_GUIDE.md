# Panduan Deployment ke Vercel - Komunitas Komentar

## 🚀 Persiapan Sebelum Deploy

### 1. Update Environment Variables di Vercel
Pastikan environment variables berikut sudah diset di Vercel Dashboard:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Admin Backfill Secret (opsional, untuk one-time script)
BACKFILL_SECRET="your-secret-key-here"
```

### 2. Verifikasi Database Schema
Pastikan database produksi sudah memiliki struktur yang sama dengan development:

- Tabel `members` menggunakan kolom `clerk_id` (bukan `clerkId`)
- Tabel `user_privileges` menggunakan kolom `clerk_id` (bukan `user_email`)
- Semua index dan constraint sudah dibuat

## 📝 Langkah-langkah Deployment

### Step 1: Push Code ke GitHub
```bash
git add .
git commit -m "feat: migrate from email-based to clerk_id-based authentication"
git push origin main
```

### Step 2: Deploy ke Vercel
1. Login ke Vercel Dashboard
2. Import project dari GitHub repository
3. Set environment variables (lihat daftar di atas)
4. Deploy

### Step 3: Run Database Migration (jika diperlukan)
Jika database produksi masih menggunakan struktur lama, jalankan script migration:

```sql
-- Lihat file: prisma/migration-production.sql
-- Jalankan script tersebut di database produksi
```

### Step 4: Backfill Clerk IDs (jika diperlukan)
Jika ada member yang belum memiliki `clerk_id`, jalankan backfill script:

```bash
# Access URL (ganti dengan domain Vercel Anda):
https://your-app.vercel.app/api/admin/backfill-clerk-ids?secret=your-secret-key
```

### Step 5: Verifikasi Deployment
1. Test login/logout
2. Test admin access
3. Test user privileges
4. Test webhook Clerk

## 🔧 Troubleshooting

### Error: "clerk_id field not found"
- Pastikan database migration sudah dijalankan
- Periksa schema.prisma vs database struktur

### Error: "Prisma client out of sync"
- Regenerate Prisma client:
```bash
npx prisma generate
```

### Error: Admin access denied
- Pastikan user sudah memiliki privilege admin di database:
```sql
INSERT INTO user_privileges (clerk_id, privilege, is_active) 
VALUES ('your-clerk-user-id', 'admin', true);
```

### Error: Webhook tidak berfungsi
- Periksa CLERK_WEBHOOK_SECRET di environment variables
- Periksa endpoint webhook di Clerk Dashboard: `https://your-app.vercel.app/api/webhooks/clerk`

## 📊 Monitoring Post-Deploy

### 1. Check Logs
Monitor Vercel function logs untuk error:
- Database connection errors
- Authentication errors
- API route errors

### 2. Database Health Check
```sql
-- Cek total users dengan clerk_id
SELECT COUNT(*) FROM members WHERE clerk_id IS NOT NULL;

-- Cek privileges yang aktif
SELECT privilege, COUNT(*) FROM user_privileges WHERE is_active = true GROUP BY privilege;
```

### 3. Test Critical Paths
- User registration flow
- Profile completion
- Task submission
- Admin functions

## 🔄 Rollback Plan
Jika terjadi masalah critical:

1. Revert di Vercel ke deployment sebelumnya
2. Restore database dari backup (jika diperlukan)
3. Check dan fix issues di development
4. Re-deploy

## 📞 Support
Jika ada masalah deployment, cek:
1. Vercel function logs
2. Database connection
3. Environment variables
4. Clerk webhook configuration
