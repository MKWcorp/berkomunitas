# 🔥 Event Boost System - Dokumentasi Lengkap

## 📖 Overview

Sistem Event Boost adalah fitur fleksibel untuk memberikan peningkatan poin loyalitas secara temporer pada platform Komunitas Komentar. Sistem ini dirancang dengan komponen yang dapat digunakan kembali dan konfigurasi terpusat untuk memudahkan manajemen event di masa depan.

## 🎯 Fitur Utama

### ✨ **Komponen Reusable**
- 6 varian komponen boost display untuk berbagai kebutuhan UI
- Desain konsisten dengan Glass Theme
- Conditional rendering berdasarkan status event
- Animasi dan efek visual menarik

### ⚙️ **Konfigurasi Terpusat**
- Single source of truth untuk semua pengaturan event
- Multiple event support (main event, weekend boost, special events)
- Date range validation
- Easy activation/deactivation

### 🚀 **Easy Management**
- Aktivasi/deaktivasi event hanya dengan mengubah 1 flag
- Tidak perlu hardcode di multiple files
- Backward compatibility dengan sistem existing

## 🧩 Komponen yang Tersedia

### 1. **EventBoostBanner**
```jsx
<EventBoostBanner 
  isActive={isEventActive}
  title={eventConfig.title}
  description={eventConfig.description}
  boostPercentage={boostPercentage}
/>
```
**Penggunaan:** Header halaman untuk pengumuman event besar
- Tampilan full-width banner dengan gradient background
- Auto-hide ketika event tidak aktif
- Animasi pulse untuk menarik perhatian

### 2. **EventBoostBadge**
```jsx
<EventBoostBadge 
  isActive={isEventActive}
  boostPercentage={boostPercentage}
  size="sm|md|lg"
/>
```
**Penggunaan:** Badge kecil untuk indikator boost
- Compact display untuk space terbatas
- Multiple size variants
- Fire emoji dengan animasi

### 3. **EventBoostInlineDisplay**
```jsx
<EventBoostInlineDisplay 
  isActive={isEventActive}
  boostPercentage={boostPercentage}
/>
```
**Penggunaan:** Display inline dalam status dan text
- Seamless integration dengan text content
- Minimal footprint design
- Gradient background dengan rounded corners

### 4. **EventBoostRewardDisplay**
```jsx
<EventBoostRewardDisplay 
  isActive={isEventActive}
  boostPercentage={boostPercentage}
/>
```
**Penggunaan:** Section reward dan poin
- Emphasis pada peningkatan poin
- Clear visual hierarchy
- Attractive color scheme

### 5. **EventBoostCompletionDisplay**
```jsx
<EventBoostCompletionDisplay 
  isActive={isEventActive}
  boostPercentage={boostPercentage}
/>
```
**Penggunaan:** Status completion dan achievement
- Celebration-style design
- Success color palette
- Completion context messaging

### 6. **EventBoostTableDisplay**
```jsx
<EventBoostTableDisplay 
  isActive={isEventActive}
  boostPercentage={boostPercentage}
/>
```
**Penggunaan:** Table dan list views
- Compact table cell display
- Consistent alignment
- Minimal disruption to table layout

## 🎛️ Hook System

### **useEventBoost**
```jsx
import { useMainEventBoost } from '../hooks/useEventBoost';

const { 
  isEventActive, 
  boostPercentage, 
  eventConfig,
  activateEvent,
  deactivateEvent
} = useMainEventBoost();
```

### **useEventBoost (Custom)**
```jsx
import { useEventBoost } from '../hooks/useEventBoost';

const { 
  isEventActive, 
  boostPercentage, 
  eventConfig 
} = useEventBoost('WEEKEND_BOOST');
```

## 🔧 Konfigurasi Event

### **Event Settings Structure**
```javascript
const EVENT_BOOST_SETTINGS = {
  MAIN_EVENT: {
    key: 'main_event_boost',
    isActive: false,                    // ← Control utama event
    boostPercentage: 300,              // Persentase boost (300% = 4x lipat)
    pointValue: 30,                    // Default point saat boost aktif
    title: "EVENT SPESIAL: BOOST POINTS!",
    description: "Selesaikan tugas sekarang dan dapatkan poin loyalty berlipat!",
    startDate: "2024-12-01",          // Format: YYYY-MM-DD
    endDate: "2024-12-15",            // Format: YYYY-MM-DD
  },
  
  WEEKEND_BOOST: {
    key: 'weekend_boost',
    isActive: false,
    boostPercentage: 200,              // 200% = 3x lipat
    pointValue: 20,
    title: "WEEKEND BOOST: DOUBLE POINTS!",
    description: "Weekend spesial dengan double points untuk semua tugas!",
    startDate: null,                   // null = tidak ada validasi tanggal
    endDate: null,
  },

  SPECIAL_BOOST: {
    key: 'special_boost',
    isActive: false,
    boostPercentage: 500,              // 500% = 6x lipat
    pointValue: 50,
    title: "MEGA BOOST: 5X POINTS!",
    description: "Event mega boost dengan 5x lipat points!",
    startDate: null,
    endDate: null,
  }
};
```

## 🚀 Cara Menggunakan

### **1. Aktivasi Event Baru**
```javascript
// File: src/hooks/useEventBoost.js
MAIN_EVENT: {
  key: 'main_event_boost',
  isActive: true,                      // ← Ubah ke true
  boostPercentage: 400,               // Boost 400% (5x lipat)
  pointValue: 40,                     // 40 poin per tugas
  title: "RAMADAN BOOST: 5X POINTS!",
  description: "Bulan suci dengan berkah berlipat - dapatkan 5x lipat poin!",
  startDate: "2025-03-10",           // Mulai Ramadan
  endDate: "2025-04-09",             // Selesai Ramadan
},
```

### **2. Implementasi di Component**
```jsx
import { useMainEventBoost } from '../hooks/useEventBoost';
import { EventBoostBanner, EventBoostRewardDisplay } from '../components/EventBoostComponents';

export default function TaskPage() {
  const { isEventActive, boostPercentage, eventConfig } = useMainEventBoost();
  
  return (
    <div>
      {/* Banner di header */}
      <EventBoostBanner 
        isActive={isEventActive}
        title={eventConfig.title}
        description={eventConfig.description}
        boostPercentage={boostPercentage}
      />
      
      {/* Reward display */}
      <div className="mb-6 flex items-center gap-2">
        <span>Reward: {task.point_value} Poin</span>
        <EventBoostRewardDisplay 
          isActive={isEventActive}
          boostPercentage={boostPercentage}
        />
      </div>
    </div>
  );
}
```

### **3. Multiple Event Types**
```jsx
// Weekend boost terpisah
const { 
  isEventActive: isWeekendActive, 
  boostPercentage: weekendBoost 
} = useEventBoost('WEEKEND_BOOST');

// Special event
const { 
  isEventActive: isSpecialActive, 
  boostPercentage: specialBoost 
} = useEventBoost('SPECIAL_BOOST');
```

## 📱 Responsive Design

Semua komponen Event Boost mengikuti sistem responsive Glass Theme:

```jsx
// Responsive sizing
<div className="text-xs sm:text-sm">
  <EventBoostInlineDisplay 
    isActive={isEventActive}
    boostPercentage={boostPercentage}
  />
</div>

// Mobile-first approach
<div className="px-2 sm:px-3 py-1">
  <EventBoostBadge 
    isActive={isEventActive}
    boostPercentage={boostPercentage}
    size="sm"
  />
</div>
```

## 🎨 Design System Integration

### **Glass Theme Compatibility**
- Menggunakan gradient backgrounds yang konsisten
- Backdrop blur effects untuk glass morphism
- Heroicons untuk iconography
- Tailwind CSS utilities untuk styling
- Animasi pulse dan transitions yang smooth

### **Color Palette**
```css
/* Event boost gradient */
bg-gradient-to-r from-orange-500 to-red-500

/* Glass background */
backdrop-blur-sm bg-white/10

/* Text colors */
text-white, text-orange-600, text-red-600

/* Border styles */
border-orange-200, rounded-full, rounded-lg
```

## 🔄 Migration dari Hardcoded

### **Before (Hardcoded)**
```jsx
{task.point_value && (
  <div className="mb-6 flex items-center gap-2 text-yellow-700">
    <TrophyIcon className="w-5 h-5" />
    <span className="font-semibold">Reward: {task.point_value} Poin</span>
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
      🔥 300% BOOST
    </div>
  </div>
)}
```

### **After (Reusable)**
```jsx
{task.point_value && (
  <div className="mb-6 flex items-center gap-2 text-yellow-700">
    <TrophyIcon className="w-5 h-5" />
    <span className="font-semibold">Reward: {task.point_value} Poin</span>
    <EventBoostRewardDisplay 
      isActive={isEventActive}
      boostPercentage={boostPercentage}
    />
  </div>
)}
```

## 🧪 Testing Scenarios

### **1. Event Aktif**
- Semua komponen boost muncul dengan styling yang benar
- Animasi dan efek visual berfungsi
- Text dan persentase sesuai konfigurasi

### **2. Event Tidak Aktif**
- Semua komponen boost tersembunyi
- Layout tetap rapi tanpa space kosong
- Tidak ada error console

### **3. Multiple Events**
- Event berbeda bisa aktif bersamaan
- Komponen tidak bertabrakan
- Performance tetap optimal

### **4. Date Validation**
- Event otomatis nonaktif jika melewati endDate
- Validation berjalan di client dan server
- Graceful handling untuk date format error

## 🚀 Best Practices

### **1. Performance**
```jsx
// ✅ Good - Destructure yang diperlukan saja
const { isEventActive, boostPercentage } = useMainEventBoost();

// ❌ Avoid - Destructure seluruh object
const eventData = useMainEventBoost();
```

### **2. Conditional Rendering**
```jsx
// ✅ Good - Component handles condition internally
<EventBoostBanner isActive={isEventActive} {...props} />

// ❌ Avoid - External condition check
{isEventActive && <EventBoostBanner {...props} />}
```

### **3. Configuration**
```jsx
// ✅ Good - Clear naming dan dokumentasi
RAMADAN_BOOST: {
  key: 'ramadan_boost_2025',
  isActive: true,
  boostPercentage: 400,
  title: "RAMADAN BOOST: 5X POINTS!",
  description: "Berkah berlipat di bulan suci",
  startDate: "2025-03-10",
  endDate: "2025-04-09",
}

// ❌ Avoid - Generic naming
EVENT_1: {
  key: 'event1',
  isActive: true,
  boostPercentage: 400,
}
```

## 📈 Future Enhancements

### **Planned Features**
- **Admin Panel Integration**: GUI untuk mengatur event boost
- **Scheduled Events**: Otomatis aktivasi berdasarkan cron job
- **Analytics**: Tracking performance dan engagement event
- **A/B Testing**: Multiple event variant testing
- **User Targeting**: Event boost untuk segment user tertentu
- **Notification System**: Alert saat event dimulai/berakhir

### **Advanced Configuration**
```javascript
// Future enhancement ideas
ADVANCED_EVENT: {
  key: 'advanced_event',
  isActive: true,
  boostPercentage: 300,
  targeting: {
    userSegments: ['new_users', 'loyal_users'],
    regions: ['jakarta', 'surabaya'],
    minLoyaltyPoints: 100,
  },
  scheduling: {
    autoStart: true,
    autoEnd: true,
    timezone: 'Asia/Jakarta',
    notifications: true,
  },
  analytics: {
    trackEngagement: true,
    compareBaseline: true,
    abTestVariant: 'A',
  }
}
```

## 🎯 Conclusion

Sistem Event Boost menyediakan fondasi yang kuat dan fleksibel untuk manajemen event di platform Komunitas Komentar. Dengan desain component-based dan konfigurasi terpusat, sistem ini memungkinkan:

- **Easy Management**: Aktivasi event dengan satu perubahan konfigurasi
- **Scalable**: Mudah ditambahkan event baru atau jenis boost berbeda  
- **Maintainable**: Code yang bersih dan terdokumentasi dengan baik
- **Consistent**: Design system terintegrasi dengan Glass Theme
- **Future-Ready**: Arsitektur yang mendukung enhancement di masa depan

Event boost sekarang menjadi fitur yang powerful namun mudah dikelola, siap mendukung berbagai strategi engagement dan retention di komunitas! 🚀
