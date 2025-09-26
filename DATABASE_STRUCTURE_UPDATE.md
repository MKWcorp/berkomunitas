# Database Structure Update - BerkomunitasPlus System

## Perubahan Struktur Database

Struktur database telah diperbaharui untuk menggunakan relasi yang tepat sesuai dengan sistem yang sudah ada:

### ❌ **Struktur Lama (Error)**
```sql
bc_drwskincare_plus_verified:
  user_id -> users(id)  -- ERROR: Table 'users' tidak ada
```

### ✅ **Struktur Baru (Fixed)**
```sql
bc_drwskincare_plus_verified:
  api_data_id -> bc_drwskincare_api(id)     -- Link ke data API yang dinamis
  connection_id -> bc_drwskincare_plus(id)  -- Link ke status koneksi
```

## Alur Data (Data Flow)

### 1. **bc_drwskincare_api**
- **Fungsi**: Menyimpan data API yang selalu berubah
- **Karakteristik**: Data dinamis, update otomatis dari API external
- **Contoh Data**: Nama, nomor HP, alamat dari Beauty Consultant

### 2. **bc_drwskincare_plus** 
- **Fungsi**: Menyimpan status koneksi user dengan Beauty Consultant
- **Karakteristik**: Relationship table, tracking connection status
- **Fields**: `user_id`, `bc_api_id`, `created_at`

### 3. **bc_drwskincare_plus_verified** (NEW)
- **Fungsi**: Menyimpan data terverifikasi yang bisa diedit user
- **Karakteristik**: User-editable, stable data
- **Relasi**:
  - `connection_id` → Connects to `bc_drwskincare_plus(id)`
  - `api_data_id` → References `bc_drwskincare_api(id)` (optional)

## Keuntungan Struktur Baru

### 1. **Separation of Concerns**
- **API Data**: Dynamic, auto-updated
- **Connection Status**: Tracking relationships  
- **Verified Data**: User-controlled, editable

### 2. **Data Integrity**
- API data bisa berubah tanpa mempengaruhi data user
- Connection status tetap terjaga
- User punya kontrol penuh atas data verified-nya

### 3. **Flexibility**
- User bisa edit data tanpa mengganggu API data asli
- System bisa track perubahan data user
- Reference ke API data tetap tersedia untuk comparison

## Schema Definition

```sql
CREATE TABLE bc_drwskincare_plus_verified (
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
```

## API Changes

### Updated Endpoints

#### GET /api/plus/verified-data
```javascript
// Sekarang menggunakan connection_id sebagai primary lookup
const connection = await prisma.bc_drwskincare_plus.findFirst({
  where: { user_id: member.id }
});

const verifiedData = await prisma.bc_drwskincare_plus_verified.findFirst({
  where: { connection_id: connection.id },
  include: {
    bc_drwskincare_api: true, // Include API data
    bc_drwskincare_plus: true // Include connection info
  }
});
```

#### POST /api/plus/verified-data
```javascript
// Create/update menggunakan connection_id
const verifiedData = await prisma.bc_drwskincare_plus_verified.upsert({
  where: { connection_id: connection.id },
  update: { /* user data */ },
  create: {
    connection_id: connection.id,
    api_data_id: apiDataId, // Optional reference
    /* user data */
  }
});
```

## Migration Steps

### 1. **Drop Old Table (jika sudah dibuat)**
```sql
DROP TABLE IF EXISTS bc_drwskincare_plus_verified;
```

### 2. **Create New Table**
```sql
-- Run create-bc-drwskincare-plus-verified-table.sql
```

### 3. **Test Relationships**
```sql
-- Run test-database-relationships.sql
```

### 4. **Verify API Functionality**
- Test GET endpoint untuk retrieve data
- Test POST endpoint untuk save/update data
- Verify foreign key constraints

## Example Usage

### Complete Data Query
```sql
SELECT 
    api.nama_lengkap as api_name,
    api.nomor_hp as api_phone,
    conn.created_at as connection_date,
    verified.nama_lengkap as verified_name,
    verified.nomor_hp as verified_phone,
    verified.alamat_lengkap,
    verified.instagram_username,
    verified.updated_at as last_update
FROM bc_drwskincare_plus conn
LEFT JOIN bc_drwskincare_api api ON conn.bc_api_id = api.id
LEFT JOIN bc_drwskincare_plus_verified verified ON conn.id = verified.connection_id
WHERE conn.user_id = USER_ID;
```

## Benefits Summary

✅ **Fixed database relations**  
✅ **Proper separation of API data vs user data**  
✅ **Maintained connection tracking**  
✅ **Flexible user data management**  
✅ **Data integrity and consistency**  

Struktur database sekarang sudah sesuai dengan sistem yang ada dan memungkinkan pengelolaan data yang lebih efisien dan terorganisir.