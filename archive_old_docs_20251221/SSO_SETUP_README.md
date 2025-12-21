# 🔐 SSO Setup Guide - Berkomunitas

## ✅ Migration Status

Database migration telah selesai! Tables SSO sudah dibuat:
- ✅ `PlatformSession` - Menyimpan user sessions
- ✅ `UserActivity` - Track aktivitas user (untuk point system)
- ✅ `RegisteredPlatform` - Platform yang terdaftar
- ✅ `members` table updated dengan kolom SSO (google_id, email, last_login_at, sso_metadata)

**Total members di database: 81**

## 🔑 API Keys Generated

Platform API keys sudah dibuat (tersimpan di `platform_api_keys.txt`):

```
Berkomunitas: sk_berkomunitas_F1QKGkR9ctrX47QVSNO5EhUcCtlSBsRYHGIdlHCZzVc
DRW Skincare: sk_drwskincare_Fuo2HxqjinEITeLMM51227ZWL8FAMX84-RJULEK1jbA
POS System: sk_pos_t8rlwLklfuAy7KtRyrV-fMOnuGT53I-YKn0EUA1-Ty4
```

## 📋 Next Steps

### 1. Setup Google OAuth

Anda perlu mendapatkan Google OAuth credentials dari Google Cloud Console:

**A. Buka Google Cloud Console**
   - Go to: https://console.cloud.google.com
   - Select or create a project

**B. Enable Google+ API**
   - Navigate to: APIs & Services > Library
   - Search for "Google+ API" 
   - Click "Enable"

**C. Create OAuth 2.0 Credentials**
   - Go to: APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "Berkomunitas SSO"
   
**D. Configure Authorized URLs**

   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://berkomunitas.com
   ```
   
   **Authorized redirect URIs:**
   ```
   http://localhost:3000
   https://berkomunitas.com
   http://localhost:3000/auth/callback
   https://berkomunitas.com/auth/callback
   ```

**E. Copy Credentials**
   - You'll get:
     - Client ID: `xxxxxx.apps.googleusercontent.com`
     - Client Secret: `GOCSPX-xxxxxx`

**F. Update .env file**

Replace these values in `.env`:
```env
GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
```

### 2. Update Prisma Client

```bash
npx prisma generate
```

### 3. Test SSO Login

**A. Start dev server:**
```bash
npm run dev
```

**B. Test Login Page:**
Go to: http://localhost:3000/test-sso-login

**C. Test API Endpoints:**

1. **Google Login:**
```bash
POST /api/sso/google-login
Content-Type: application/json

{
  "googleToken": "your_google_id_token",
  "platform": "Berkomunitas"
}
```

2. **Verify Token:**
```bash
POST /api/sso/verify-token
Content-Type: application/json

{
  "token": "your_jwt_token"
}
```

3. **Track Activity:**
```bash
POST /api/sso/track-activity
Authorization: Bearer your_jwt_token
Content-Type: application/json

{
  "activityType": "login",
  "platform": "Berkomunitas",
  "metadata": {}
}
```

## 📦 Dependencies Installed

```json
{
  "@react-oauth/google": "^0.12.1",
  "google-auth-library": "^9.6.3",
  "jsonwebtoken": "^9.0.2"
}
```

## 🎯 How SSO Works

### Login Flow:

```
1. User clicks "Login with Google"
2. Google OAuth popup appears
3. User signs in with Google account
4. Google returns ID token
5. Frontend sends token to: POST /api/sso/google-login
6. Backend verifies token with Google
7. Backend creates/updates user in database
8. Backend generates JWT access token + refresh token
9. Backend saves session in PlatformSession table
10. Frontend stores tokens in localStorage
11. User is logged in!
```

### Token Usage:

```javascript
import { loginWithGoogle, verifyToken, trackActivity } from '@/lib/sso';

// Login
const user = await loginWithGoogle(googleToken, 'Berkomunitas');

// Verify token
const user = await verifyToken(accessToken);

// Track activity (earn points!)
await trackActivity('purchase', 'Berkomunitas', { orderId: '123', amount: 100000 });
```

## 💰 Point System

User mendapat coin untuk aktivitas:

| Activity | Coins Earned |
|----------|--------------|
| login | 1 |
| purchase | 10 |
| review | 5 |
| referral | 20 |
| post_comment | 3 |
| share | 2 |
| course_complete | 15 |
| appointment_book | 5 |
| task_complete | 10 |
| daily_check_in | 2 |

## 🔒 Security Notes

1. ✅ JWT secrets sudah di-generate (64 karakter random)
2. ✅ Google OAuth menggunakan HTTPS di production
3. ✅ Tokens expire: Access (7 hari), Refresh (30 hari)
4. ✅ Passwords TIDAK disimpan (Google OAuth only)
5. ⚠️  **NEVER** commit `.env` file ke Git
6. ⚠️  **NEVER** expose JWT secrets
7. ⚠️  **NEVER** share API keys publicly

## 📱 Integration untuk Platform Lain

### DRW Skincare (Next.js)

```javascript
import { loginWithGoogle } from '@/lib/sso';

// Copy lib/sso.js ke project drwskincare
// Update SSO_API_URL ke: https://berkomunitas.com/api/sso

const handleGoogleLogin = async (googleToken) => {
  const user = await loginWithGoogle(googleToken, 'DRW Skincare');
  // User sekarang logged in di semua platform!
};
```

### POS System (Flutter)

Lihat guide lengkap di: `SSO_IMPLEMENTATION_GUIDE_FOR_BERKOMUNITAS.md` (Section 4.2)

## 🐛 Troubleshooting

### Error: "Invalid Google token"
- Check GOOGLE_CLIENT_ID di .env
- Pastikan Google OAuth sudah enabled
- Token Google expire dalam 1 jam

### Error: "JWT verification failed"
- Check JWT_SECRET di .env
- Token might be expired (7 days)

### Database connection error
- Check DATABASE_URL di .env
- Check PostgreSQL is running
- Check firewall allows connection to port 5432

## 📞 Need Help?

1. Check logs: `npm run dev` dan lihat console
2. Check database: Gunakan psql atau PgAdmin
3. Test API dengan Postman/Insomnia
4. Read full guide: `SSO_IMPLEMENTATION_GUIDE_FOR_BERKOMUNITAS.md`

---

**Status:** ✅ Database migrated, Ready for Google OAuth setup
**Date:** December 21, 2025
**Migration Files:**
- `scripts/migrate-sso-tables.py` - Main migration script
- `scripts/generate-jwt-secrets.js` - JWT generator
- `backup_members_structure_*.sql` - Database backups
- `platform_api_keys.txt` - Platform API keys
