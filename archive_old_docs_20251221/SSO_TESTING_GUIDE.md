# 🧪 SSO Testing Guide

## ✅ Migrasi SSO Selesai!

**Status:** READY FOR TESTING  
**Tanggal:** 21 Desember 2024

---

## 📋 Yang Sudah Selesai

### 1. ✅ Database Migration
- [x] 78 users berhasil dimigras dari Clerk ke SSO
- [x] Semua data preserved (coins, loyalty points, badges, history)
- [x] Table `PlatformSession`, `UserActivity`, `RegisteredPlatform` dibuat
- [x] Column `google_id`, `email`, `last_login_at`, `sso_metadata` ditambahkan

### 2. ✅ Backend API
- [x] `/api/sso/google-login` - Google OAuth + auto-link
- [x] `/api/sso/verify-token` - JWT verification
- [x] `/api/sso/refresh-token` - Token refresh
- [x] `/api/sso/track-activity` - Activity tracking
- [x] `getCurrentUser(request)` helper untuk server-side auth

### 3. ✅ Frontend Components
- [x] Login page dengan Google OAuth (`/login`)
- [x] `useSSOUser()` hook sebagai pengganti `useUser()`
- [x] Updated components:
  - NavigationMenu
  - NavigationWrapper  
  - UserProfileDropdown
  - NotificationBell
  - ProfileNameEditor
  - useProfileCompletion hook
  - useAdminStatus hook

### 4. ✅ Middleware Protection
- [x] Simple route protection seperti Clerk
- [x] JWT verification di middleware
- [x] Auto-redirect ke `/login?returnUrl=...`
- [x] Protected routes: `/profil`, `/tugas`, `/rewards`, etc.

### 5. ✅ Dependencies
- [x] `jose` package installed (JWT verification)
- [x] `@react-oauth/google` installed (Google OAuth)
- [x] Environment variables configured

---

## 🧪 Testing Steps

### Test 1: Login Flow (User Baru)
```bash
# 1. Buka browser
http://localhost:3000/login

# 2. Expected result:
- ✅ Tombol "Sign in with Google" muncul
- ✅ Info tentang benefits login (1 coin, etc.) muncul

# 3. Click "Sign in with Google"
- ✅ Google OAuth popup muncul
- ✅ Pilih akun Google
- ✅ Redirect ke halaman yang dituju atau profil

# 4. Check localStorage:
console.log(localStorage.getItem('access_token')); // Should show JWT
console.log(localStorage.getItem('sso_user')); // Should show user data

# 5. Check cookies (DevTools > Application > Cookies):
- ✅ access_token cookie exists
- ✅ refresh_token cookie exists
```

### Test 2: Protected Route Access
```bash
# 1. TANPA Login - coba akses halaman protected
http://localhost:3000/profil

# Expected result:
- ✅ Redirect ke /login?returnUrl=/profil
- ✅ Console log: "[SSO Middleware] Page without token - redirecting to login"

# 2. DENGAN Login - coba akses halaman protected
http://localhost:3000/profil

# Expected result:
- ✅ Halaman profil muncul
- ✅ Console log: "[SSO Middleware] Token valid - allowing access"
- ✅ Data profil load dengan benar
```

### Test 3: User Lama (Clerk Migration)
```bash
# 1. Login dengan Google menggunakan email yang sudah pernah daftar via Clerk

# Expected result:
- ✅ System detect email sudah ada
- ✅ Auto-link Google ID ke account existing
- ✅ Semua data preserved (coins, loyalty points, badges)
- ✅ User bisa login dan lihat data lengkap

# 2. Check database:
# SELECT * FROM members WHERE email = 'user@example.com';
# Expected:
- ✅ google_id field ter-update
- ✅ clerk_id masih ada (backward compatibility)
- ✅ coin dan loyalty_point tidak berubah
```

### Test 4: Navigation & Components
```bash
# 1. Check Navigation Menu
- ✅ GUEST: Tombol "Login" muncul
- ✅ LOGGED IN: Profile avatar + points muncul
- ✅ LOGGED IN: Notification bell muncul

# 2. Check Profile Dropdown
- ✅ Avatar muncul dengan benar
- ✅ Display name dari username atau email
- ✅ Menu "Profil Saya", "Pengaturan", "Sign Out" muncul

# 3. Test Sign Out
- ✅ Click "Sign Out"
- ✅ Redirect ke homepage
- ✅ localStorage cleared
- ✅ cookies cleared
```

### Test 5: API Endpoints
```bash
# Test profile API dengan token
curl -X GET http://localhost:3000/api/profil \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -v

# Expected:
- ✅ Status 200 OK
- ✅ User data returned

# Test profile API tanpa token
curl -X GET http://localhost:3000/api/profil -v

# Expected:
- ✅ Status 401 Unauthorized
- ✅ Error message: "Authentication required"
```

### Test 6: Middleware Logs
```bash
# Check terminal console untuk middleware logs:

# Expected logs saat akses /profil tanpa login:
[SSO Middleware] /profil
[SSO Middleware] Protected route: /profil Token: MISSING
[SSO Middleware] Page without token - redirecting to login

# Expected logs saat akses /profil dengan login:
[SSO Middleware] /profil
[SSO Middleware] Protected route: /profil Token: EXISTS
[SSO Middleware] Token verification: VALID
[SSO Middleware] Token valid - allowing access
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "jose module not found"
```bash
# Solution:
npm install jose
# or
yarn add jose
```

### Issue 2: Redirect loop antara /login dan /profil
```bash
# Check:
1. localStorage.getItem('access_token') - harus ada
2. Cookie access_token - harus ada
3. Token masih valid (belum expired)

# Solution: Clear storage dan login ulang
localStorage.clear();
# Reload page
```

### Issue 3: Google OAuth button tidak muncul
```bash
# Check .env:
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id

# Make sure client ID valid dan ter-configure di Google Cloud Console
```

### Issue 4: Token expired
```bash
# JWT tokens expire after:
- Access token: 7 days
- Refresh token: 30 days

# Solution: System akan auto-refresh atau redirect ke login
```

---

## 📊 Database Verification

### Check Migrated Users
```sql
-- Check total users dengan Google ID
SELECT COUNT(*) FROM members WHERE google_id IS NOT NULL;
-- Expected: Should match migrated count

-- Check user dengan Clerk ID (backward compatibility)
SELECT COUNT(*) FROM members WHERE clerk_id IS NOT NULL;
-- Expected: Should be >= migrated count

-- Check recent logins
SELECT email, last_login_at, coin, loyalty_point 
FROM members 
WHERE last_login_at IS NOT NULL 
ORDER BY last_login_at DESC 
LIMIT 10;
```

### Check Platform Sessions
```sql
-- Check active sessions
SELECT COUNT(*) FROM "PlatformSession" WHERE expires_at > NOW();

-- Check user activities
SELECT activity_type, COUNT(*) as total, SUM(points_earned) as total_points
FROM "UserActivity"
GROUP BY activity_type
ORDER BY total DESC;
```

---

## 🚀 Production Deployment Checklist

### Before Deploy:
- [ ] Test semua flow di localhost
- [ ] Verify all protected routes work
- [ ] Test user lama dan user baru login
- [ ] Check API endpoints dengan Postman/curl
- [ ] Verify middleware logs

### Deploy Steps:
1. [ ] Update Google Cloud Console:
   - Add production domain ke Authorized JavaScript origins
   - Add production domain/api/sso/google-callback ke Authorized redirect URIs

2. [ ] Update Environment Variables di Production:
   ```bash
   GOOGLE_CLIENT_ID=your-production-client-id
   GOOGLE_CLIENT_SECRET=your-production-secret
   JWT_SECRET=your-production-jwt-secret-64-chars
   JWT_REFRESH_SECRET=your-production-refresh-secret-64-chars
   DATABASE_URL=your-production-database
   ```

3. [ ] Deploy ke Vercel/server

4. [ ] Test production login immediately

5. [ ] Monitor error logs

---

## 📝 Next Steps (Optional)

### 1. Additional Protected Routes
Tambahkan routes lain yang perlu protection di `middleware.js`:
```javascript
const protectedRoutes = [
  // ...existing routes...
  "/admin",
  "/dashboard",
  // etc.
];
```

### 2. Remove Clerk Dependencies (Optional)
Jika sudah yakin SSO works 100%:
```bash
npm uninstall @clerk/nextjs
# Update package.json
```

### 3. Update Remaining Pages
Ada beberapa pages yang masih pakai Clerk:
- `/tugas/[id]/page.js`
- `/security/page.js`
- `/rewards-app/` pages
- Update satu per satu dengan `useSSOUser()`

---

## 🎉 Success Criteria

SSO dianggap berhasil jika:
- ✅ User bisa login dengan Google
- ✅ Protected routes redirect ke login
- ✅ User data loaded with correct
- ✅ Coins & loyalty points preserved
- ✅ Middleware logs show correct flow
- ✅ No console errors
- ✅ Navigation components work
- ✅ Profile page accessible after login

---

## 📞 Support

Jika ada masalah:
1. Check console logs (browser & terminal)
2. Check middleware logs di terminal
3. Verify localStorage & cookies
4. Check database for user data
5. Review error messages

Happy testing! 🚀
