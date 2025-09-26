# 🔗 N8N WORKFLOW COMPATIBILITY SYSTEM

## ✅ MASALAH SOLVED!

**SEBELUM:** `setting_value = "true"` tidak bisa dikalikan matematis di N8N  
**SESUDAH:** Sistem hybrid yang mendukung multiple format untuk kompatibilitas N8N

---

## 📋 FORMAT SETTING_VALUE YANG DIDUKUNG

### **1. 🎯 Multiplier Mode (1-10)**
**Untuk N8N Workflow - Multiplier langsung**

```sql
-- Contoh database:
setting_value = "2"   → 2x multiplier   → 20 poin (10 * 2)
setting_value = "3"   → 3x multiplier   → 30 poin (10 * 3)
setting_value = "5"   → 5x multiplier   → 50 poin (10 * 5)
```

**Frontend Display:**
- 2x → 200% BOOST  
- 3x → 300% BOOST
- 5x → 500% BOOST

### **2. 📊 Percentage Mode (>10)**  
**Untuk Percentage Boost**

```sql
-- Contoh database:
setting_value = "200" → 200% boost → 20 poin
setting_value = "300" → 300% boost → 30 poin  
setting_value = "500" → 500% boost → 50 poin
```

**N8N Multiplier:** Percentage / 100 = multiplier

### **3. ✅ Boolean Mode**
**Backward compatibility**

```sql
-- Contoh database:
setting_value = "true"   → Default boost dari kode (200%)
setting_value = "active" → Default boost dari kode (200%)
```

---

## 🔧 N8N WORKFLOW INTEGRATION

### **Query untuk N8N (Dynamic Event Boost)**

```sql
-- Replace query "Penambahan Point Loyalitas" di N8N dengan ini:
WITH event_multiplier AS (
  SELECT 
    CASE 
      WHEN setting_value ~ '^[0-9]+(\.[0-9]+)?$' THEN
        CASE 
          WHEN setting_value::numeric <= 10 THEN setting_value::numeric
          ELSE setting_value::numeric / 100
        END
      ELSE 2.0  -- default fallback
    END as multiplier
  FROM event_settings 
  WHERE setting_name = 'weekend_point_value'
    AND start_date <= NOW() 
    AND end_date >= NOW()
  LIMIT 1
),
point_calculation AS (
  SELECT 
    COALESCE(em.multiplier, 1.0) as final_multiplier,
    (10 * COALESCE(em.multiplier, 1.0))::integer as final_points
  FROM event_multiplier em
)
INSERT INTO loyalty_point_history (member_id, event, point, task_id, event_type)
SELECT 
  $1 as member_id,
  'Penyelesaian Tugas (Event: ' || pc.final_multiplier || 'x)',
  pc.final_points,
  $2 as task_id,
  'event_boost'
FROM point_calculation pc
RETURNING json_build_object(
    'member_id', member_id,
    'points_added', point,
    'multiplier_used', (point::numeric / 10),
    'event_active', true
);
```

---

## 🧪 TEST CASES

| setting_value | N8N Multiplier | Frontend Display | Poin Diberikan |
|---------------|----------------|------------------|----------------|
| `"2"`         | 2x             | 200% BOOST       | 20 poin        |
| `"3"`         | 3x             | 300% BOOST       | 30 poin        |
| `"200"`       | 2x             | 200% BOOST       | 20 poin        |
| `"500"`       | 5x             | 500% BOOST       | 50 poin        |
| `"true"`      | 2x             | 200% BOOST       | 20 poin        |

---

## 🚀 IMPLEMENTASI DI ADMIN PANEL

### **Cara Setting Event Baru:**

```sql
-- Method 1: Multiplier langsung (recommended untuk N8N)
INSERT INTO event_settings VALUES (
  'weekend_triple_boost',     -- Nama unik
  '3',                        -- 3x multiplier
  'Weekend Triple Boost - 3x Points!',
  '2025-09-21 00:00:00',      -- Start weekend
  '2025-09-22 23:59:59'       -- End weekend  
);

-- Method 2: Percentage boost
INSERT INTO event_settings VALUES (
  'flash_sale_mega', 
  '1000',                     -- 1000% boost (10x)
  'Flash Sale Mega - 10x Points!',
  '2025-12-25 10:00:00',
  '2025-12-25 23:59:59'
);
```

---

## ⚠️ PENTING UNTUK N8N WORKFLOW

### **DO's ✅**
- Gunakan angka 1-10 untuk multiplier sederhana (`"2"`, `"3"`, `"5"`)
- Gunakan angka >10 untuk percentage (`"200"`, `"500"`, `"1000"`)
- Test query di PostgreSQL sebelum deploy ke N8N
- Gunakan `setting_name = 'weekend_point_value'` untuk weekend events

### **DON'Ts ❌**  
- ❌ Jangan gunakan `"true"` jika butuh multiplier custom
- ❌ Jangan hardcode multiplier di N8N (gunakan query dynamic)
- ❌ Jangan lupa validasi `start_date` dan `end_date`

---

## 🔄 MIGRATION EXISTING EVENTS

**Update event yang sudah ada:**

```sql
-- Update weekend event dari "true" ke multiplier
UPDATE event_settings 
SET setting_value = '3'  -- 3x multiplier
WHERE setting_name = 'weekend_point_value';

-- Check hasil
SELECT 
  setting_name, 
  setting_value,
  start_date,
  end_date,
  CASE 
    WHEN setting_value::numeric <= 10 THEN setting_value || 'x multiplier'
    ELSE (setting_value::numeric / 100) || 'x multiplier'
  END as interpretation
FROM event_settings 
WHERE start_date <= NOW() AND end_date >= NOW();
```

---

## ✨ KEUNGGULAN SISTEM BARU

1. **🔗 N8N Compatible:** Multiplier matematis yang bisa dikalikan
2. **📊 Flexible:** Support multiplier & percentage format  
3. **🔄 Backward Compatible:** Event lama dengan "true" tetap jalan
4. **⚡ Auto-Activation:** Otomatis aktif berdasarkan waktu
5. **🎯 Dynamic:** Admin bisa ubah boost tanpa restart aplikasi
6. **📱 Responsive:** Frontend otomatis update tampilan boost

---

**🎉 READY TO USE!** Event boost sekarang fully compatible dengan N8N workflow dan tetap user-friendly di frontend!
