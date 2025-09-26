# Fix: Kolom alamat_detail Belum Terisi

## Masalah yang Ditemukan:

1. **Missing alamat_lengkap di handleSave payload** ❌
2. **Missing alamat_lengkap di setEditData untuk data baru (404)** ❌ 
3. **Missing alamat_lengkap di handleCancel reset** ❌

## Perbaikan yang Dilakukan:

### 1. Fix handleSave Payload
**File**: `src/app/plus/verified/page.js`
```javascript
// BEFORE: alamat_lengkap tidak dikirim
body: JSON.stringify({
  nama_lengkap: editData.nama_lengkap,
  // ... other fields
  // alamat_lengkap MISSING!
})

// AFTER: alamat_lengkap ditambahkan
body: JSON.stringify({
  nama_lengkap: editData.nama_lengkap,
  // ... other fields
  alamat_lengkap: editData.alamat_lengkap, // ✅ ADDED
})
```

### 2. Fix setEditData untuk Data Baru
**File**: `src/app/plus/verified/page.js`
```javascript
// BEFORE: alamat_lengkap tidak ada untuk data baru
setEditData({
  nama_lengkap: member?.nama_lengkap || '',
  // ... other fields
  // alamat_lengkap MISSING!
});

// AFTER: alamat_lengkap ditambahkan
setEditData({
  nama_lengkap: member?.nama_lengkap || '',
  // ... other fields
  alamat_lengkap: '', // ✅ ADDED
});
```

### 3. Fix handleCancel Reset
**File**: `src/app/plus/verified/page.js`
```javascript
// BEFORE: alamat_lengkap tidak direset saat cancel
setEditData({
  nama_lengkap: verifiedData?.nama || '',
  // ... other fields
  // alamat_lengkap MISSING!
});

// AFTER: alamat_lengkap direset dengan alamat_detail dari database
setEditData({
  nama_lengkap: verifiedData?.nama || '',
  // ... other fields
  alamat_lengkap: verifiedData?.alamat_detail || '', // ✅ ADDED
});
```

### 4. Added Debug Logging
**File**: `src/app/api/beauty-consultant/verified/route.js`
```javascript
console.log('🏠 [Verified PUT] Alamat lengkap received:', body.alamat_lengkap);
console.log('🏠 [Verified PUT] alamat_detail value:', updateData.alamat_detail);
```

## Alur Data yang Benar Sekarang:

1. **User mengisi alamat di WilayahForm** → `editData.alamat_lengkap` terisi
2. **User klik Save** → `alamat_lengkap` dikirim dalam payload API
3. **API menerima** → `body.alamat_lengkap` di-log dan disimpan ke `alamat_detail`
4. **Database updated** → Kolom `alamat_detail` tersimpan
5. **Page reload** → Data dibaca dari `verifiedData.alamat_detail` ke `editData.alamat_lengkap`

## Testing:

1. Buka halaman `/plus/verified`
2. Klik "Edit Data"
3. Pilih provinsi, kabupaten, kecamatan, desa → Alamat detail auto-fill
4. Edit alamat detail jika perlu
5. Klik "Simpan"
6. Check console untuk log: `🏠 [Verified PUT] Alamat lengkap received:`
7. Check database: kolom `alamat_detail` harus terisi
8. Refresh halaman → alamat detail harus tetap tampil

## Status: ✅ FIXED

Sekarang kolom `alamat_detail` akan tersimpan dengan benar saat form di-save!