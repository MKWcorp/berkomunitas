# 🔗 Sistem Username untuk Profil Publik - Dokumentasi Lengkap

## 📖 **Ringkasan**

Sistem username baru memungkinkan setiap user memiliki username unik untuk URL profil publik mereka, seperti `/profil/username-mereka`. Sistem ini menggantikan ketergantungan pada `profil_sosial_media` dan memberikan kontrol penuh kepada user.

---

## 🗄️ **Struktur Database**

### **Tabel Baru: `user_usernames`**
```sql
CREATE TABLE user_usernames (
  id           SERIAL PRIMARY KEY,
  member_id    INTEGER UNIQUE NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  username     VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  is_custom    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_usernames_username ON user_usernames(username);
```

### **Relasi di Tabel `members`**
- Tambah relasi `user_usernames user_usernames?` (one-to-one optional)

### **Field Baru di Tabel `members`**
- `featured_badge_id INT?` - Badge yang ditampilkan prominently di profil

---

## 🚀 **API Endpoints**

### **1. Profile API - GET `/api/profil/[username]`**
Mendapatkan data profil publik berdasarkan username.

**Response:**
```json
{
  "id": 11,
  "nama_lengkap": "Muhammad Kasyful Wiro",
  "bio": "Entrepreneur dan content creator",
  "status_kustom": "Fokus membangun bisnis digital",
  "loyalty_point": 150,
  "foto_profil_url": "/uploads/profile_123.jpg",
  "username": "mk_wiro",
  "display_name": "Kasyful Wiro",
  "is_custom_username": true,
  "currentLevel": {
    "level_number": 2,
    "level_name": "Kontributor Aktif",
    "required_points": 100
  },
  "featuredBadge": {
    "id": 5,
    "badge_name": "Top Commenter",
    "description": "Memberikan komentar berkualitas"
  },
  "badges": [...],
  "wallPosts": [...]
}
```

### **2. Username Management - GET/POST/DELETE `/api/profil/username`**

**GET** - Mendapatkan info username current user:
```json
{
  "username": "mk_wiro",
  "display_name": "Kasyful Wiro", 
  "is_custom": true,
  "has_username": true
}
```

**POST** - Create/update username:
```json
{
  "username": "new-username",
  "display_name": "Display Name"
}
```

**DELETE** - Hapus username custom (kembali ke auto-generated)

### **3. Wall Post API - POST `/api/profil/wall`**
Posting pesan di dinding profil user lain.

**Request:**
```json
{
  "profileOwnerId": 11,
  "message": "Selamat atas pencapaiannya!"
}
```

---

## 🎨 **Frontend Components**

### **1. Username Management Tab**
- **Location:** `/app/profil/page.js` - Tab "Username"
- **Features:**
  - Create/edit username custom
  - Preview URL profil
  - Validasi real-time
  - Character counter dan rules
  - Hapus username custom

### **2. Public Profile Page**
- **Location:** `/app/profil/[username]/page.js`
- **Features:**
  - Display profil lengkap dengan bio, status, level
  - Badge gallery dengan featured badge
  - Profile wall dengan posting system
  - Responsive design dengan Tailwind CSS

---

## ⚙️ **Aturan dan Validasi Username**

### **Format Username:**
- **Panjang:** 3-50 karakter
- **Karakter yang diizinkan:** huruf, angka, underscore (_), dash (-)
- **Case insensitive:** Semua username disimpan lowercase
- **Unique:** Tidak boleh sama dengan user lain

### **Reserved Usernames:**
```javascript
const reservedUsernames = [
  'admin', 'api', 'www', 'mail', 'ftp', 'localhost', 'root', 'user',
  'profile', 'dashboard', 'settings', 'login', 'register', 'signup',
  'signin', 'logout', 'about', 'contact', 'help', 'support', 'blog',
  'news', 'terms', 'privacy', 'legal', 'app', 'apps', 'mobile'
];
```

---

## 🔄 **Migrasi Data**

### **Script Migrasi: `scripts/migrate-usernames.js`**
Script ini telah dijalankan dan berhasil:
- ✅ **33 members** berhasil dimigrasikan
- ✅ Username diambil dari `profil_sosial_media` (prioritas Instagram)
- ✅ Fallback ke `user_{id}` jika tidak ada sosial media
- ✅ Auto-resolve username conflicts dengan suffix

### **Status Migrasi:**
```
📊 Found 33 members without usernames
✅ Successfully migrated: 33 members
⚠️ Skipped due to errors: 0 members
📈 Total usernames in system: 33
```

---

## 🔗 **Backward Compatibility**

### **API Profil Publik (`/api/profil/[username]`):**
1. **Prioritas 1:** Cari di `user_usernames` table (sistem baru)
2. **Fallback:** Cari di `profil_sosial_media` table (sistem lama)
3. **Error 404:** Jika tidak ditemukan di kedua tempat

### **URL Profil:**
- **Baru:** `/profil/mk_wiro` (dari `user_usernames`)
- **Lama:** `/profil/mk_wiros` (dari `profil_sosial_media`) - masih works

---

## 🎯 **Keunggulan Sistem Baru**

### **1. User Control**
- ✅ User bisa custom username sesuai keinginan
- ✅ Bisa ubah kapan saja
- ✅ Display name terpisah dari username

### **2. Data Integrity**
- ✅ Username guaranteed unique di seluruh sistem
- ✅ Tidak tercampur dengan data sosial media
- ✅ Proper foreign key constraints

### **3. URL Clean & SEO Friendly**
- ✅ `/profil/username` - clean dan mudah diingat
- ✅ Konsisten untuk semua user
- ✅ Tidak tergantung platform sosial media

### **4. Future-Proof**
- ✅ Extensible untuk fitur lain (custom domain, dll)
- ✅ Independent dari perubahan sosial media
- ✅ Migration path yang clear

---

## 📱 **User Experience Flow**

### **Setup Username Pertama:**
1. User masuk ke halaman profil
2. Klik tab "Username"
3. Isi form username + display name
4. Preview URL profil
5. Save & dapat konfirmasi

### **Edit Username:**
1. Tab "Username" menampilkan username current
2. Link preview ke profil publik
3. Button "Edit" untuk ubah
4. Button "Hapus" untuk remove custom username

### **Public Profile Access:**
1. Anyone dapat akses `/profil/username`
2. Tampilan lengkap: bio, status, badges, wall posts
3. Authenticated users bisa posting di wall
4. Responsive di mobile & desktop

---

## 🔧 **Maintenance & Monitoring**

### **Metrics untuk Monitor:**
- Total usernames created vs default
- Username uniqueness conflicts
- Profile wall post activity
- Public profile page views

### **Regular Tasks:**
- Monitor reserved username list
- Clean up unused wall posts
- Badge system maintenance
- Profile picture storage cleanup

---

## 🚦 **Next Steps & Enhancements**

### **Immediate (Ready to Use):**
- ✅ Sistem sudah production-ready
- ✅ Data migration completed
- ✅ Backward compatibility ensured

### **Future Enhancements:**
1. **Username Analytics** - Track profile visits
2. **Custom Profile Themes** - User bisa pilih warna/tema
3. **Profile Verification** - Verified badge system
4. **Profile Privacy** - Public/private profile options
5. **Social Integration** - Share profile ke sosial media

---

**🎉 Sistem Username untuk Profil Publik siap digunakan!**

**Testing URLs setelah server running:**
- Profile API: `GET /api/profil/mk_wiro`
- Username Management: `GET /api/profil/username`
- Public Profile: `GET /profil/mk_wiro`
