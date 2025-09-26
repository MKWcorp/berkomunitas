# DRW Corp Employee Management System

Sistem manajemen pegawai DRW Corp untuk leaderboard dan tracking pendaftaran.

## 📋 Overview

Sistem ini dirancang untuk mengelola dan melacak pendaftaran pegawai DRW Corp di sistem leaderboard komunitas. Sistem ini terdiri dari beberapa komponen:

- **API Endpoint**: `/api/drwcorp-employees` - Endpoint untuk analisis dan manajemen data
- **Analysis Page**: `/admin/drwcorp-analysis` - Halaman analisis real-time
- **Manager Page**: `/admin/drwcorp-manager` - Halaman manajemen pegawai
- **Configuration**: `/lib/drwcorp-employees.js` - File konfigurasi list pegawai

## 🚀 Fitur Utama

### 1. Employee Analysis
- ✅ Analisis real-time pendaftaran pegawai
- ✅ Perbandingan nama dengan database
- ✅ Deteksi kemiripan nama (similarity matching)
- ✅ Slave list untuk pegawai yang belum terdaftar
- ✅ Rekomendasi duplikasi nama

### 2. Employee Management
- ✅ Tambah pegawai baru (single/bulk)
- ✅ Edit nama pegawai
- ✅ Hapus pegawai dari list
- ✅ Validasi duplikasi otomatis
- ✅ Update real-time

### 3. Integration dengan Leaderboard
- ✅ Sinkronisasi dengan badge "DRW Corp"
- ✅ Tracking loyalty points
- ✅ Member ID mapping
- ✅ Social media profile integration

## 📊 Cara Menggunakan

### Akses Sistem
1. Login ke admin dashboard
2. Pilih tab "DRW Corp"
3. Pilih antara "Analysis" atau "Manager"

### Melihat Analisis
1. Buka `/admin/drwcorp-analysis`
2. Lihat summary pendaftaran
3. Check slave list untuk pegawai yang belum terdaftar
4. Review rekomendasi duplikasi nama

### Mengelola Pegawai
1. Buka `/admin/drwcorp-manager`
2. Tambah pegawai baru satu per satu
3. Atau tambah banyak sekaligus (bulk add)
4. Edit nama pegawai jika ada kesalahan
5. Hapus pegawai yang tidak valid

## 🔧 API Reference

### GET `/api/drwcorp-employees`
Mengembalikan analisis lengkap pegawai DRW Corp.

**Response:**
```json
{
  "success": true,
  "summary": {
    "total_employees": 54,
    "registered_count": 25,
    "unregistered_count": 29,
    "registration_percentage": 46
  },
  "registered_employees": [...],
  "unregistered_employees": [...],
  "slave_list": {
    "employees": ["Nama Pegawai 1", "Nama Pegawai 2"],
    "total": 29
  },
  "recommendations": [...]
}
```

### POST `/api/drwcorp-employees`
Mengelola data pegawai.

**Actions:**
- `add`: Tambah pegawai baru
- `remove`: Hapus pegawai
- `update`: Update nama pegawai

**Example:**
```json
{
  "action": "add",
  "newEmployees": ["Nama Pegawai Baru"]
}
```

## 📁 File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── drwcorp-analysis/
│   │   │   └── page.js          # Halaman analisis
│   │   ├── drwcorp-manager/
│   │   │   └── page.js          # Halaman manajemen
│   │   ├── tabs/
│   │   │   └── DRWCorpTab.js    # Tab admin
│   │   └── page.js              # Admin dashboard
│   └── api/
│       └── drwcorp-employees/
│           └── route.js         # API endpoint
└── lib/
    └── drwcorp-employees.js     # Konfigurasi & helper functions
```

## 🔄 Update List Pegawai

Untuk menambah pegawai baru:

1. **Via Admin Panel:**
   - Buka `/admin/drwcorp-manager`
   - Gunakan form "Tambah Pegawai Baru"
   - Atau gunakan "Tambah Banyak Pegawai" untuk bulk add

2. **Via Code (untuk development):**
   ```javascript
   import { addNewEmployees } from '@/lib/drwcorp-employees';

   addNewEmployees(['Nama Pegawai Baru 1', 'Nama Pegawai Baru 2']);
   ```

3. **Direct Edit:**
   - Edit file `/lib/drwcorp-employees.js`
   - Tambahkan nama ke array `DRW_CORP_EMPLOYEES`
   - Commit dan deploy perubahan

## 🎯 Slave List

Slave list adalah daftar pegawai yang:
- ✅ Sudah ada di master list DRW Corp
- ❌ Belum terdaftar di sistem leaderboard
- 🎯 Perlu didaftarkan ke sistem

### Cara Menggunakan Slave List:
1. Buka `/admin/drwcorp-analysis`
2. Lihat tab "Slave List"
3. Copy nama-nama pegawai
4. Daftarkan ke sistem melalui admin panel
5. Atau berikan list ke tim untuk didaftarkan

## 🔍 Similarity Matching

Sistem menggunakan algoritma Levenshtein Distance untuk mendeteksi:
- Kesalahan penulisan nama
- Duplikasi dengan variasi nama
- Kemiripan nama yang tinggi

**Threshold:** 80% similarity
**Max Recommendations:** 3 per pegawai

## 🚀 Deployment

Sistem ini kompatibel dengan Vercel dan platform hosting lainnya:

1. **Automatic:** Perubahan otomatis ter-deploy saat push ke main branch
2. **Manual:** Gunakan Vercel CLI atau dashboard
3. **Testing:** Test di development environment terlebih dahulu

## 📞 Support

Untuk pertanyaan atau masalah:
1. Check halaman analisis untuk status terkini
2. Review log error di Vercel dashboard
3. Contact tim development untuk support teknis

## 🔒 Security

- ✅ Admin-only access
- ✅ Authentication required
- ✅ Input validation
- ✅ SQL injection protection
- ✅ Rate limiting (via Vercel)

---

**Last Updated:** Agustus 2025
**Version:** 1.0.0
**Maintainer:** DRW Corp IT Team
