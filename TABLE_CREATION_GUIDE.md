# Database Table Creation Guide

## 📋 Membuat Tabel bc_drwskincare_plus_verified

### Step 1: Cek Prerequisites
Jalankan script ini untuk memastikan tabel yang diperlukan sudah ada:

```bash
psql -h your-host -d your-database -f check-database-prerequisites.sql
```

**Yang harus ada:**
- ✅ `bc_drwskincare_api` table
- ✅ `bc_drwskincare_plus` table

### Step 2: Create Table
Jalankan script untuk membuat tabel:

```bash
psql -h your-host -d your-database -f create-bc-drwskincare-plus-verified-table.sql
```

**Atau copy-paste SQL ini ke database tool:**

```sql
CREATE TABLE IF NOT EXISTS bc_drwskincare_plus_verified (
    id SERIAL PRIMARY KEY,
    api_data_id INTEGER REFERENCES bc_drwskincare_api(id) ON DELETE SET NULL,
    connection_id INTEGER REFERENCES bc_drwskincare_plus(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(255) NOT NULL,
    nomor_hp VARCHAR(20),
    alamat_lengkap TEXT,
    instagram_username VARCHAR(100),
    facebook_username VARCHAR(100),
    tiktok_username VARCHAR(100),
    youtube_username VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bc_drwskincare_plus_verified_connection_id
ON bc_drwskincare_plus_verified(connection_id);

CREATE INDEX IF NOT EXISTS idx_bc_drwskincare_plus_verified_created_at
ON bc_drwskincare_plus_verified(created_at);

CREATE INDEX IF NOT EXISTS idx_bc_drwskincare_plus_verified_api_data_id
ON bc_drwskincare_plus_verified(api_data_id);
```

### Step 3: Verify Creation
Jalankan script untuk verifikasi:

```bash
psql -h your-host -d your-database -f verify-table-creation.sql
```

### Step 4: Test API Endpoints
Test apakah API berfungsi:

```bash
node test-updated-api-structure.js
```

---

## 🎯 Quick Commands

### Jika menggunakan local PostgreSQL:
```bash
# Check prerequisites
psql -U postgres -d your_database -f check-database-prerequisites.sql

# Create table  
psql -U postgres -d your_database -f create-bc-drwskincare-plus-verified-table.sql

# Verify creation
psql -U postgres -d your_database -f verify-table-creation.sql
```

### Jika menggunakan cloud PostgreSQL (seperti Supabase, Railway, dll):
```bash
# Replace with your connection details
psql "postgresql://username:password@host:port/database" -f create-bc-drwskincare-plus-verified-table.sql
```

---

## ⚠️ Troubleshooting

### Error: relation "bc_drwskincare_api" does not exist
- Pastikan tabel `bc_drwskincare_api` sudah ada
- Check dengan: `\dt bc_drwskincare_api`

### Error: relation "bc_drwskincare_plus" does not exist  
- Pastikan tabel `bc_drwskincare_plus` sudah ada
- Check dengan: `\dt bc_drwskincare_plus`

### Error: permission denied
- Pastikan user database punya privilege CREATE TABLE
- Gunakan user dengan admin rights

---

## ✅ Success Indicators

Jika berhasil, Anda akan melihat:
- `CREATE TABLE` success message
- `CREATE INDEX` success messages  
- No error messages
- Table muncul di `\dt` list

---

## 🔍 Manual Verification

Connect ke database dan jalankan:

```sql
-- Check table exists
\dt bc_drwskincare_plus_verified

-- Check structure
\d bc_drwskincare_plus_verified  

-- Check constraints
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'bc_drwskincare_plus_verified'::regclass;

-- Check indexes
\di bc_drwskincare_plus_verified*
```

---

Setelah tabel berhasil dibuat, sistem BerkomunitasPlus akan bisa menyimpan data terverifikasi yang bisa diedit oleh user! 🚀