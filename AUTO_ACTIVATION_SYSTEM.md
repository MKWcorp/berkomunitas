# 🚀 SISTEM AUTO-ACTIVATION EVENT BOOST

## ✅ FITUR YANG SUDAH DIBUAT

### 1. **Auto-Activation Berdasarkan Waktu**
- Event **otomatis aktif** jika waktu sekarang dalam periode `start_date` ↔ `end_date`
- **Tidak perlu** manual set `setting_value = "true"`
- Real-time checking setiap 30 detik

### 2. **Dynamic Boost Percentage dari Database**
```sql
-- Contoh database events:
setting_name          | setting_value | start_date          | end_date            | description
weekend_point_value   | "300"         | 2025-09-15 21:30    | 2025-09-17 22:30   | Weekend Special - Triple points
holiday_mega_boost    | "500"         | 2025-09-16 22:30    | 2025-09-18 22:30   | Holiday Mega Boost - 5x points
birthday_special      | "true"        | 2025-09-15 22:00    | 2025-09-16 04:30   | Birthday Special - Default boost
flash_sale_boost      | "1000"        | 2025-09-10 22:30    | 2025-09-13 22:30   | Flash Sale (expired)
```

### 3. **Multiple Events Support**
- **Berbagai event** dapat aktif bersamaan
- Setiap event punya **setting_name** unik sebagai ID
- **Nama event dapat bebas** - tidak mempengaruhi fungsi, hanya untuk identifikasi

### 4. **Flexible Setting Value Logic**
```javascript
// Auto-activation logic:
const settingValue = event.setting_value;

// 1. Numeric Boost: angka > 0 = auto-active dengan boost percentage
if (!isNaN(parseFloat(settingValue)) && parseFloat(settingValue) > 0) {
  boostPercentage = parseFloat(settingValue); // 300 = 300%
  pointValue = Math.round(boostPercentage / 10); // 300% = 30 poin
}

// 2. Boolean Activation: "true" atau "active" = auto-active dengan default boost
if (settingValue === 'true' || settingValue === 'active') {
  // Gunakan boostPercentage dari kode (200% default)
}

// 3. Inactive: "false", "0", atau nilai lain = not active
```

## 🎯 CARA KERJA PENJADWALAN

### **Skenario 1: Event dengan Boost Percentage Custom**
```sql
INSERT INTO event_settings VALUES (
  'flash_sale_2025', 
  '500',  -- 500% boost!
  'Flash Sale Mega Boost - 5x Points!',
  '2025-12-25 00:00:00',  -- Mulai Christmas
  '2025-12-26 23:59:59'   -- Berakhir Boxing Day
);
```
**Hasil:** Event otomatis aktif pada Christmas-Boxing Day dengan 500% boost

### **Skenario 2: Event dengan Default Boost**
```sql
INSERT INTO event_settings VALUES (
  'weekend_reguler', 
  'true',  -- Gunakan default dari kode
  'Weekend Reguler - Double Points',
  '2025-09-20 00:00:00',  -- Mulai weekend
  '2025-09-21 23:59:59'   -- Berakhir weekend
);
```
**Hasil:** Event otomatis aktif dengan boost 200% (dari kode)

### **Skenario 3: Multiple Events Bersamaan**
- `weekend_point_value = "300"` (300% boost)
- `special_promo = "200"` (200% boost) 
- `member_birthday = "true"` (default 200% boost)

**Semua aktif bersamaan!** User bisa dapat boost berbeda untuk tugas berbeda.

## 📊 KOMPONEN YANG TERSEDIA

### 1. **useEventBoost(eventType)** - Single Event Hook
```javascript
const { isActive, boostPercentage, pointValue } = useEventBoost('WEEKEND_BOOST');
// Maps WEEKEND_BOOST → weekend_point_value di database
```

### 2. **useMultipleEventBoost()** - Multiple Events Hook
```javascript
const { 
  activeEvents,        // Array semua event aktif
  upcomingEvents,      // Array event yang akan datang
  highestBoostEvent,   // Event dengan boost tertinggi
  totalBoostPercentage // Total semua boost percentage
} = useMultipleEventBoost();
```

### 3. **AutoEventBoostBanner** - Komponen Auto-Display
```javascript
<AutoEventBoostBanner eventType="WEEKEND_BOOST" />
// Otomatis muncul jika event aktif, hilang jika tidak aktif
```

### 4. **MultipleEventBoostDisplay** - Tampilan Semua Events
```javascript
<MultipleEventBoostDisplay />
// Menampilkan semua event aktif + upcoming events
```

## 🔧 CONTOH PENGGUNAAN

### **Update halaman Tugas:**
```javascript
// src/app/tugas/page.js
import { AutoEventBoostBanner } from '@/components/MultipleEventBoostDisplay';

export default function TugasPage() {
  return (
    <div>
      {/* Auto-show jika ada event weekend aktif */}
      <AutoEventBoostBanner eventType="WEEKEND_BOOST" />
      
      {/* Konten tugas lainnya */}
    </div>
  );
}
```

### **Admin Panel Integration:**
```javascript
// Buat event baru dari admin
const newEvent = {
  setting_name: 'ramadan_special_2025',
  setting_value: '400',  // 400% boost
  description: 'Ramadan Special - 4x Points untuk semua tugas!',
  start_date: '2025-03-01 00:00:00',
  end_date: '2025-03-30 23:59:59'
};

// Event otomatis aktif pada periode Ramadan!
```

## ✨ KEUNGGULAN SISTEM BARU

1. **✅ Auto-Activation:** Tidak perlu manual aktif/nonaktif
2. **✅ Dynamic Boost:** Boost percentage dari database, bukan hardcode
3. **✅ Multiple Events:** Banyak event aktif bersamaan
4. **✅ Flexible Naming:** Nama event bebas untuk organisasi
5. **✅ Real-time:** Auto-refresh setiap 30 detik
6. **✅ Time-based:** Schedule event jauh-jauh hari
7. **✅ Backward Compatible:** Event lama tetap berfungsi

## 🎮 TEST COMMANDS

```bash
# Lihat semua events dan status auto-activation
node test-auto-activation.js

# Buat multiple events untuk testing
node demo-multiple-events.js

# Debug current active events
node debug-current-events.js
```

---

**🎉 KESIMPULAN:** 
Sistem sekarang **fully automated**! Admin cukup buat event di database dengan `start_date`, `end_date`, dan `setting_value` (boost percentage). Event akan otomatis aktif/nonaktif sesuai waktu dan menampilkan boost yang sesuai di frontend!
