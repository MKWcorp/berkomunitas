# SSO Middleware Guide - Simple Route Protection

## 🎯 Overview

Middleware SSO ini memberikan perlindungan route yang simple seperti Clerk, tapi menggunakan JWT authentication. Tidak perlu setup kompleks, cukup tambahkan route ke array dan middleware akan otomatis protect!

## 🚀 Fitur

- ✅ **Auto-redirect** ke login untuk protected routes
- ✅ **JWT Verification** built-in
- ✅ **Return URL** support (redirect kembali setelah login)
- ✅ **API Protection** dengan 401 Unauthorized
- ✅ **User Info Headers** untuk API routes
- ✅ **Maintenance Mode** support

## 📋 Cara Kerja

### 1. Public Routes (No Auth Required)

Routes yang bisa diakses tanpa login:

```javascript
const publicRoutes = [
  "/",
  "/login",
  "/faq",
  "/landing",
  "/user-guide",
  "/privacy-policy",
  "/api/dashboard", // Public API
];
```

**Tambah Public Route:**
```javascript
// Cukup tambahkan path ke array
const publicRoutes = [
  // ...existing routes
  "/new-public-page",  // ✅ Tambahkan route baru
];
```

### 2. Protected Routes (Auth Required)

Routes yang HARUS login dulu:

```javascript
const protectedRoutes = [
  "/profil",
  "/tugas",
  "/rewards",
  "/api/profil",
  "/api/admin",
];
```

**Tambah Protected Route:**
```javascript
// Cukup tambahkan path ke array
const protectedRoutes = [
  // ...existing routes
  "/my-new-protected-page",  // ✅ Harus login
  "/api/my-protected-api",   // ✅ API butuh auth
];
```

### 3. Auto-Redirect Flow

**Untuk Pages:**
```
User akses /profil (protected)
  ↓
Tidak ada token
  ↓
Redirect ke /login?returnUrl=/profil
  ↓
User login dengan Google
  ↓
Redirect kembali ke /profil
```

**Untuk API:**
```
POST /api/profil/update (protected)
  ↓
Tidak ada token
  ↓
Return 401 Unauthorized
{
  "success": false,
  "message": "Authentication required"
}
```

## 🔧 Konfigurasi

### 1. Environment Variables

Pastikan `.env` sudah ada:

```env
JWT_SECRET=your-64-character-secret-key
JWT_REFRESH_SECRET=your-64-character-refresh-secret-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. Token Storage

Token disimpan di **cookies** dan **localStorage**:

```javascript
// Auto-set by loginWithGoogle()
Cookies: access_token, refresh_token
LocalStorage: sso_user, access_token
```

### 3. Token Verification

Middleware otomatis verify JWT:

```javascript
// Di middleware.js
const payload = await verifyToken(accessToken);
// payload = { userId, email, google_id, exp, iat }

// Jika valid, tambahkan headers untuk API
response.headers.set('x-user-id', payload.userId);
response.headers.set('x-user-email', payload.email);
```

## 📝 Contoh Penggunaan

### Example 1: Protect Page Baru

```javascript
// src/app/my-dashboard/page.js
'use client';

import { useSSOUser } from '@/hooks/useSSOUser';

export default function MyDashboard() {
  const { user, isLoaded, isSignedIn } = useSSOUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // Middleware sudah handle redirect ke login
  // Jadi di sini user PASTI sudah login
  
  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
    </div>
  );
}
```

**Tambahkan di middleware:**
```javascript
const protectedRoutes = [
  // ...existing
  "/my-dashboard",  // ✅ Add this
];
```

### Example 2: Protect API Route

```javascript
// src/app/api/my-data/route.js
import { getCurrentUser } from '@/lib/ssoAuth';

export async function GET(request) {
  // Middleware sudah verify token
  // Jadi getCurrentUser() akan return user
  const user = await getCurrentUser(request);
  
  if (!user) {
    return Response.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  // User valid, lanjut fetch data
  return Response.json({
    success: true,
    data: { userId: user.id, email: user.email }
  });
}
```

**Tambahkan di middleware:**
```javascript
const protectedRoutes = [
  // ...existing
  "/api/my-data",  // ✅ Add this
];
```

### Example 3: Optional Auth (Public + User Info)

Kadang route perlu bisa diakses public TAPI bisa detect user jika login:

```javascript
// Jangan tambahkan ke protectedRoutes
// Biarkan di publicRoutes atau tidak di mana-mana

// src/app/public-page/page.js
'use client';

import { useSSOUser } from '@/hooks/useSSOUser';

export default function PublicPage() {
  const { user, isSignedIn } = useSSOUser();

  return (
    <div>
      <h1>Public Page - Everyone Can Access</h1>
      
      {isSignedIn ? (
        <p>Halo, {user.email}! You're logged in.</p>
      ) : (
        <p>You're browsing as guest.</p>
      )}
    </div>
  );
}
```

## 🔒 Security Features

### 1. JWT Verification

Middleware verify token setiap request:

```javascript
async function verifyToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;  // Valid token
  } catch (error) {
    return null;  // Invalid/expired token
  }
}
```

### 2. Token Expiration

- **Access Token**: 7 hari
- **Refresh Token**: 30 hari

Jika token expired, user otomatis redirect ke login.

### 3. HTTPS Only (Production)

Cookies dengan `Secure` flag di production:

```javascript
// Set in loginWithGoogle()
document.cookie = `access_token=${token}; path=/; max-age=604800; ${
  process.env.NODE_ENV === 'production' ? 'secure;' : ''
}`;
```

## 🛠️ Maintenance Mode

Aktifkan maintenance mode:

```env
MAINTENANCE_MODE=true
```

**Behavior:**
- Semua routes redirect ke `/maintenance`
- Except: `/api/webhooks`, `/api/sso`

## 📊 Perbandingan dengan Clerk

| Feature | Clerk | SSO Middleware |
|---------|-------|----------------|
| Route Protection | `clerkMiddleware()` | `protectedRoutes` array |
| Public Routes | `publicRoutes()` | `publicRoutes` array |
| Auto-redirect | ✅ | ✅ |
| User Info | `auth()` | `getCurrentUser()` |
| Token Management | Auto | JWT + Cookies |
| Setup Complexity | Medium | Simple |
| Cost | Paid (limited free) | Free |

## 🎓 Best Practices

### 1. Protect Sensitive Routes

```javascript
const protectedRoutes = [
  "/profil",           // ✅ User profile
  "/admin",            // ✅ Admin panel
  "/api/admin",        // ✅ Admin API
  "/api/profil",       // ✅ User data API
  "/rewards",          // ✅ User rewards
];
```

### 2. Keep Public Routes Public

```javascript
const publicRoutes = [
  "/",                 // ✅ Homepage
  "/faq",              // ✅ FAQ page
  "/landing",          // ✅ Landing page
  "/api/dashboard",    // ✅ Public stats
];
```

### 3. Use Return URL

```javascript
// Automatic with middleware
// User visits /profil → redirects to /login?returnUrl=/profil
// After login → returns to /profil

// Manual redirect
<Link href="/login?returnUrl=/custom-page">
  Login to continue
</Link>
```

### 4. Handle Loading States

```javascript
const { user, isLoaded } = useSSOUser();

if (!isLoaded) {
  return <LoadingSpinner />;
}

// Now safe to use user
```

## 🐛 Troubleshooting

### Problem: Redirect loop

**Solution:**
```javascript
// Make sure login page is in publicRoutes
const publicRoutes = [
  "/login",  // ✅ Must be public!
];
```

### Problem: API returns 401

**Solution:**
```javascript
// Check token in cookies
console.log(document.cookie);  // Should have access_token

// Or check Authorization header
fetch('/api/profil', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});
```

### Problem: User not redirected after login

**Solution:**
```javascript
// Check returnUrl is preserved
const params = new URLSearchParams(window.location.search);
const returnUrl = params.get('returnUrl') || '/profil';

// After login
router.push(returnUrl);
```

## 📚 Files Struktur

```
src/
├── middleware.js              # SSO Middleware (THIS FILE!)
├── lib/
│   ├── sso.js                 # Client-side SSO helpers
│   └── ssoAuth.js             # Server-side SSO auth
├── hooks/
│   └── useSSOUser.js          # React hook for user data
└── app/
    ├── login/
    │   └── page.js            # Login page with returnUrl
    └── api/
        └── sso/
            ├── google-login/  # Google OAuth handler
            ├── verify-token/  # Token verification
            └── refresh-token/ # Token refresh
```

## ✅ Quick Checklist

- [x] Middleware configured
- [x] JWT_SECRET set in .env
- [x] Protected routes listed
- [x] Public routes listed
- [x] Login page handles returnUrl
- [x] useSSOUser hook available
- [x] getCurrentUser for API routes

## 🎉 Summary

**SSO Middleware = Clerk-like Protection, Zero Complexity!**

Just add route to array → Auto-protected! 🔒

```javascript
// Protect route in 1 line:
const protectedRoutes = [...existing, "/my-new-page"];

// That's it! 🎉
```
