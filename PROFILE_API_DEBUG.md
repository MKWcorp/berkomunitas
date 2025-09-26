# Debug Profile API Response

Untuk test apakah API profil sudah mengembalikan data dengan benar di production.

## Quick Test Commands

### 1. Test API Profil Response
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-domain.vercel.app/api/profil
```

### 2. Test dengan Console Browser
Buka browser developer tools di halaman profil dan jalankan:

```javascript
// Test fetch API profil
fetch('/api/profil', { credentials: 'include' })
  .then(res => res.json())
  .then(data => {
    console.log('🔍 Profile API Response:', data);
    console.log('✅ Has member?', !!data.data?.member);
    console.log('✅ Has socialProfiles?', !!data.data?.socialProfiles);
    console.log('✅ Has badges?', !!data.data?.badges);
    console.log('✅ Has level?', !!data.data?.level);
  })
  .catch(err => console.error('❌ Profile API Error:', err));

// Test fallback dashboard API
fetch('/api/profil/dashboard', { credentials: 'include' })
  .then(res => res.json())
  .then(data => {
    console.log('🔍 Dashboard API Response:', data);
    console.log('✅ Fallback working?', !!data.data?.member);
  })
  .catch(err => console.error('❌ Dashboard API Error:', err));
```

### 3. Check Network Tab
1. Buka browser developer tools → Network tab
2. Refresh halaman /profil
3. Lihat request ke `/api/profil` dan response-nya
4. Response harus berbentuk:
```json
{
  "success": true,
  "data": {
    "member": { ... },
    "socialProfiles": [...],
    "badges": [...],
    "level": { ... }
  }
}
```

## What Was Fixed

### Before ❌
```javascript
// API mengembalikan format salah:
{
  "success": true,
  "data": { ...memberData },  // member data langsung di data
  "socialProfiles": [...]     // socialProfiles di root level
}
```

### After ✅  
```javascript
// API sekarang mengembalikan format yang benar:
{
  "success": true,
  "data": {
    "member": { ...memberData },      // member wrapped di data.member
    "socialProfiles": [...],          // socialProfiles di data.socialProfiles  
    "badges": [...],                  // badges data ditambahkan
    "level": { current, next, ... }   // level data ditambahkan
  }
}
```

### Page Logic
Halaman profil menggunakan logic:
```javascript
if (res.ok) {
  const d = data.data || data;  // Ambil data.data kalau ada
  setMember(d.member);          // Expect d.member (bukan d langsung)
  setSocialProfiles(d.socialProfiles || []);
  setBadges(d.badges || []);
  setLevel(d.level || defaultLevel);
}
```

## Expected Result
Setelah fix ini, halaman profil di Vercel seharusnya:
- ✅ Menampilkan nama lengkap member
- ✅ Menampilkan foto profil  
- ✅ Menampilkan level dan progress
- ✅ Menampilkan form edit profil dengan data tersisi
- ✅ Menampilkan badges yang sudah diraih
