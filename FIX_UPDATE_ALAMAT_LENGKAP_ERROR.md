# Fix: updateAlamatLengkap is not defined Error

## 🐛 Error yang Terjadi:
```
ReferenceError: updateAlamatLengkap is not defined
    at WilayahForm.useEffect
```

## 🔍 Root Cause:
Saya menggunakan fungsi `updateAlamatLengkap` di useEffect tapi lupa mendefinisikan fungsinya terlebih dahulu.

## ✅ Perbaikan yang Dilakukan:

### 1. Menambahkan Fungsi `updateAlamatLengkap`
**File**: `src/app/components/WilayahForm.js`

```javascript
// Helper function to update alamat_lengkap based on current form data
const updateAlamatLengkap = (currentFormData) => {
  const addressParts = [
    currentFormData.desa,
    currentFormData.kecamatan,
    currentFormData.kabupaten,
    currentFormData.provinsi,
    currentFormData.kode_pos
  ].filter(Boolean);
  
  if (addressParts.length > 0) {
    const newFormData = {
      ...currentFormData,
      alamat_lengkap: addressParts.join(', ')
    };
    setFormData(newFormData);
    
    // Notify parent
    if (onAddressChange) {
      onAddressChange(newFormData);
    }
  }
};
```

### 2. Updated All useEffect
Semua useEffect yang melakukan reset field sekarang menggunakan:
- `updateFormDataInternal()` untuk update internal state
- `updateAlamatLengkap()` untuk update alamat setelah reset

## 🎯 Fungsi `updateAlamatLengkap`:

**Purpose**: Auto-generate alamat_lengkap berdasarkan pilihan wilayah
**Format**: "DESA, KECAMATAN, KABUPATEN, PROVINSI, KODE_POS"
**Trigger**: Dipanggil setelah reset dependent fields

## 🔄 Alur Kerja Sekarang:

1. **User pilih Provinsi** → Reset kabupaten/kecamatan/desa → Auto-update alamat_lengkap
2. **User pilih Kabupaten** → Reset kecamatan/desa → Auto-update alamat_lengkap  
3. **User pilih Kecamatan** → Reset desa → Auto-update alamat_lengkap
4. **User pilih Desa** → Direct auto-update alamat_lengkap
5. **User input Kode Pos** → Direct auto-update alamat_lengkap

## Status: ✅ FIXED

Error `updateAlamatLengkap is not defined` sudah diperbaiki. Form alamat sekarang bisa berfungsi dengan normal!