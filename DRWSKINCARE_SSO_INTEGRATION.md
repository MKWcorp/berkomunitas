# 🔐 DRW Skincare - SSO Integration Guide

**For:** DRW Skincare Development Team  
**Date:** December 21, 2024  
**Estimated Time:** 30 minutes  
**Difficulty:** Easy ⭐

---

## 📋 Overview

Panduan ini untuk mengintegrasikan **drwskincare.com** dengan **Berkomunitas SSO** agar user bisa:

✅ Login dengan akun Google yang sama di drwskincare.com  
✅ Points otomatis terakumulasi di system berkomunitas  
✅ Session persist across platforms (login sekali di mana saja)  
✅ User data synchronized (email, name, photo)

---

## 🎯 What You'll Get

### Before Integration
```
drwskincare.com
    ↓
Google OAuth (standalone)
    ↓
Local user database
    ↓
❌ No point system
❌ Separate from other platforms
```

### After Integration
```
drwskincare.com
    ↓
Google OAuth
    ↓
berkomunitas.com/api/sso/google-login
    ↓
Universal JWT Token
    ↓
✅ Points accumulate
✅ Unified with berkomunitas, drwprime, etc.
✅ Single user database
```

---

## ⏱ Timeline

| Step | Task | Time |
|------|------|------|
| 1 | Update Google OAuth settings | 5 min |
| 2 | Install dependencies | 2 min |
| 3 | Create SSO library | 10 min |
| 4 | Update login button | 5 min |
| 5 | Track activities | 5 min |
| 6 | Test | 3 min |
| **Total** | | **~30 min** |

---

## 🚀 Step-by-Step Integration

### Step 1: Update Google OAuth (5 minutes)

#### 1.1 Go to Google Cloud Console

Visit: https://console.cloud.google.com/apis/credentials

#### 1.2 Select Your OAuth Client

Find your existing OAuth 2.0 Client ID untuk drwskincare.com

#### 1.3 Add Authorized Domain

**Authorized JavaScript origins:**
```
https://drwskincare.com
https://www.drwskincare.com
http://localhost:3000 (for development)
```

**Authorized redirect URIs:**
```
https://drwskincare.com
https://www.drwskincare.com
http://localhost:3000 (for development)
```

**Note:** Tidak perlu redirect URI khusus `/api/auth/callback` karena kita pakai popup mode.

#### 1.4 Save

Click **SAVE**. Changes take effect immediately.

---

### Step 2: Install Dependencies (2 minutes)

```bash
cd /path/to/drwskincare-project

# Install Google OAuth package (if not installed)
npm install @react-oauth/google

# Install axios (optional, for cleaner HTTP calls)
npm install axios
```

---

### Step 3: Create SSO Library (10 minutes)

#### 3.1 Create SSO Helper File

Create file: `src/lib/sso.ts` (atau `.js` jika tidak pakai TypeScript)

```typescript
// src/lib/sso.ts
/**
 * SSO Integration with Berkomunitas Central Auth
 * 
 * This library handles authentication with berkomunitas.com SSO system.
 * All user authentication flows through berkomunitas for unified user management.
 */

const SSO_API_URL = 'https://berkomunitas.com/api/sso';
const PLATFORM_NAME = 'DRW Skincare';

// Types (optional, untuk TypeScript)
interface User {
  id: number;
  email: string;
  name: string;
  foto_profil_url?: string;
  coin: number;
  loyalty_point: number;
}

interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * Login dengan Google OAuth
 * Exchange Google token dengan Universal JWT dari berkomunitas
 * 
 * @param googleToken - ID token dari Google OAuth
 * @returns User object atau null jika gagal
 */
export async function loginWithGoogle(googleToken: string): Promise<User | null> {
  try {
    const response = await fetch(`${SSO_API_URL}/google-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        googleToken, 
        platform: PLATFORM_NAME 
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('SSO Login failed:', error);
      return null;
    }
    
    const data: LoginResponse = await response.json();
    
    // Store tokens in localStorage
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    
    // Also store in sessionStorage for backup
    sessionStorage.setItem('user_email', data.user.email);
    
    console.log('✅ SSO Login successful:', data.user.email);
    
    return data.user;
  } catch (error) {
    console.error('SSO Login error:', error);
    return null;
  }
}

/**
 * Verify JWT token
 * Check if current token is still valid
 * 
 * @param token - JWT access token
 * @returns User object atau null jika invalid
 */
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const response = await fetch(`${SSO_API_URL}/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.valid ? data.user : null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Refresh access token
 * Get new access token using refresh token
 * 
 * @param refreshToken - JWT refresh token
 * @returns New access token atau null jika gagal
 */
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${SSO_API_URL}/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Update stored token
    localStorage.setItem('access_token', data.accessToken);
    
    return data.accessToken;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

/**
 * Track user activity
 * Send activity data to berkomunitas for point accumulation
 * 
 * @param activityType - Type of activity (purchase, review, etc.)
 * @param metadata - Additional data (optional)
 */
export async function trackActivity(
  activityType: string, 
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.warn('⚠️ No access token found, cannot track activity');
      return;
    }
    
    const response = await fetch(`${SSO_API_URL}/track-activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        platform: PLATFORM_NAME,
        activityType,
        metadata: metadata || {},
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Activity tracked: ${activityType} (+${data.activity?.pointsEarned || 0} points)`);
    }
  } catch (error) {
    console.error('Track activity error:', error);
    // Don't throw - activity tracking should not break app
  }
}

/**
 * Get current user info
 * Fetch user data using stored token
 * 
 * @returns User object atau null
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      return null;
    }
    
    // Try to verify current token
    const user = await verifyToken(token);
    
    if (user) {
      return user;
    }
    
    // Token expired, try to refresh
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      const newToken = await refreshAccessToken(refreshToken);
      if (newToken) {
        return await verifyToken(newToken);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Logout user
 * Clear all stored tokens and redirect to home
 */
export function logout(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  sessionStorage.clear();
  
  console.log('✅ Logged out successfully');
  
  // Redirect to home page
  window.location.href = '/';
}

/**
 * Check if user is authenticated
 * Quick check without API call
 * 
 * @returns true if token exists
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}
```

#### 3.2 Create TypeScript Types (Optional)

If using TypeScript, create `src/types/sso.ts`:

```typescript
// src/types/sso.ts
export interface SSOUser {
  id: number;
  email: string;
  name: string;
  foto_profil_url?: string;
  coin: number;
  loyalty_point: number;
  google_id?: string;
}

export interface SSOLoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: SSOUser;
}

export interface SSOActivity {
  id: string;
  pointsEarned: number;
  totalPoints: number;
}
```

---

### Step 4: Update Login Button (5 minutes)

#### 4.1 Update Google Login Component

Find your existing Google login button component (misal: `src/components/Auth/GoogleLoginButton.tsx`)

**Before (Standalone Google OAuth):**
```tsx
import { GoogleLogin } from '@react-oauth/google';

export default function GoogleLoginButton() {
  const handleSuccess = async (credentialResponse: any) => {
    // Old code - login langsung tanpa SSO
    const { credential } = credentialResponse;
    // ... handle login locally
  };
  
  return <GoogleLogin onSuccess={handleSuccess} />;
}
```

**After (With SSO Integration):**
```tsx
'use client'; // If using Next.js App Router

import { GoogleLogin } from '@react-oauth/google';
import { loginWithGoogle } from '@/lib/sso';
import { useState } from 'react';

export default function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Google login initiated...');
      
      // Exchange Google token with berkomunitas SSO
      const user = await loginWithGoogle(credentialResponse.credential);
      
      if (user) {
        console.log('✅ SSO Login successful:', user.email);
        
        // Track login activity
        await trackActivity('login');
        
        // Redirect to dashboard atau home
        window.location.href = '/dashboard';
        // Or use Next.js router:
        // router.push('/dashboard');
      } else {
        setError('Login gagal. Silakan coba lagi.');
        console.error('❌ SSO Login failed');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleError = () => {
    console.error('❌ Google OAuth error');
    setError('Google login error. Silakan coba lagi.');
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        text="continue_with"
        shape="rectangular"
        size="large"
        width="100%"
      />
      
      {loading && (
        <div className="text-center text-gray-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Connecting to SSO...</p>
        </div>
      )}
    </div>
  );
}
```

#### 4.2 Wrap App with GoogleOAuthProvider

Update `src/app/layout.tsx` (atau file root lain):

```tsx
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
```

**Tambah di `.env.local`:**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

---

### Step 5: Track Activities (5 minutes)

#### 5.1 Track Purchases

Update checkout/payment success handler:

```typescript
// src/pages/checkout/success.tsx (or wherever payment success is handled)
import { trackActivity } from '@/lib/sso';

async function handlePaymentSuccess(order: Order) {
  // Your existing code...
  
  // Track activity in berkomunitas
  await trackActivity('purchase', {
    orderId: order.id,
    amount: order.total,
    products: order.items.length,
    paymentMethod: order.paymentMethod,
    timestamp: new Date().toISOString(),
  });
  
  console.log('✅ Purchase tracked in SSO');
}
```

#### 5.2 Track Product Reviews

```typescript
// src/components/Product/ReviewForm.tsx
import { trackActivity } from '@/lib/sso';

async function handleReviewSubmit(review: Review) {
  // Save review to your database...
  
  // Track activity
  await trackActivity('review_write', {
    reviewId: review.id,
    productId: review.productId,
    rating: review.rating,
    hasPhoto: !!review.photos.length,
  });
}
```

#### 5.3 Track Appointments

```typescript
// src/pages/appointment/booking.tsx
import { trackActivity } from '@/lib/sso';

async function handleAppointmentBook(appointment: Appointment) {
  // Save appointment...
  
  // Track activity
  await trackActivity('appointment_book', {
    appointmentId: appointment.id,
    serviceType: appointment.serviceType,
    date: appointment.date,
    location: appointment.location,
  });
}
```

#### 5.4 Track Page Views (Optional)

```typescript
// src/app/layout.tsx or middleware
import { trackActivity } from '@/lib/sso';

useEffect(() => {
  // Track page view on important pages
  const path = window.location.pathname;
  
  if (['/products', '/services', '/about'].includes(path)) {
    trackActivity('page_view', {
      page: path,
      timestamp: new Date().toISOString(),
    });
  }
}, []);
```

---

### Step 6: Create useAuth Hook (Optional, 3 minutes)

Create `src/hooks/useAuth.ts` untuk kemudahan:

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { getCurrentUser, logout } from '@/lib/sso';
import type { SSOUser } from '@/types/sso';

export function useAuth() {
  const [user, setUser] = useState<SSOUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  useEffect(() => {
    async function checkAuth() {
      try {
        const userData = await getCurrentUser();
        
        if (userData) {
          setUser(userData);
          setIsSignedIn(true);
        } else {
          setUser(null);
          setIsSignedIn(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
        setIsSignedIn(false);
      } finally {
        setIsLoaded(true);
      }
    }
    
    checkAuth();
  }, []);
  
  return {
    user,
    isLoaded,
    isSignedIn,
    logout,
  };
}
```

**Usage:**
```tsx
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useAuth();
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  if (!isSignedIn) {
    return <div>Please login</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <p>Coins: {user?.coin}</p>
      <p>Loyalty Points: {user?.loyalty_point}</p>
    </div>
  );
}
```

---

## ✅ Testing (3 minutes)

### Test Checklist

```bash
# 1. Start development server
npm run dev

# 2. Open browser
open http://localhost:3000

# 3. Test login flow
□ Click "Login with Google"
□ Select Google account
□ Check console for "✅ SSO Login successful"
□ Verify redirect to dashboard
□ Check localStorage has access_token

# 4. Test token persistence
□ Refresh page
□ User should still be logged in
□ No need to re-login

# 5. Test activity tracking
□ Make a test purchase/action
□ Check console for "✅ Activity tracked"
□ Verify in berkomunitas database (ask admin)

# 6. Test logout
□ Click logout button
□ Verify tokens cleared from localStorage
□ Redirect to home page
```

### Test with Postman

```bash
# 1. Get access token from localStorage (in browser console)
localStorage.getItem('access_token')

# 2. Test verify token
POST https://berkomunitas.com/api/sso/verify-token
Body: {
  "token": "your-access-token-here"
}

# 3. Test track activity
POST https://berkomunitas.com/api/sso/track-activity
Headers: Authorization: Bearer your-access-token
Body: {
  "platform": "DRW Skincare",
  "activityType": "test_activity",
  "metadata": {
    "test": true
  }
}
```

---

## 🐛 Troubleshooting

### Issue 1: "Invalid Google token"

**Cause:** Google Client ID mismatch

**Solution:**
1. Check `.env.local` has correct `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
2. Verify Client ID matches in Google Cloud Console
3. Check domain is authorized in Google OAuth settings

### Issue 2: "CORS error"

**Cause:** Domain not whitelisted in berkomunitas

**Solution:**
Contact berkomunitas admin to add drwskincare.com to CORS whitelist.

Temporary fix (development only):
```bash
# Use browser extension to disable CORS
# Or test from same domain
```

### Issue 3: Token expired

**Cause:** Access token expired (7 days)

**Solution:**
Code should auto-refresh. Check refresh token logic:
```typescript
const user = await getCurrentUser(); // This auto-refreshes
```

### Issue 4: Activity not tracking

**Cause:** Invalid token or network error

**Solution:**
1. Check token exists: `localStorage.getItem('access_token')`
2. Check network tab for failed requests
3. Verify user is logged in
4. Check console for errors

---

## 📊 Monitoring

### Check User Login

```sql
-- In berkomunitas database
SELECT 
  email, 
  nama_lengkap, 
  last_login_at,
  sso_metadata->>'lastLoginPlatform' as platform
FROM members
WHERE sso_metadata->>'lastLoginPlatform' = 'DRW Skincare'
ORDER BY last_login_at DESC
LIMIT 10;
```

### Check Activities

```sql
-- Check tracked activities
SELECT 
  m.email,
  ua.platform,
  ua."activityType",
  ua."pointsEarned",
  ua."createdAt"
FROM "UserActivity" ua
JOIN members m ON ua."memberId" = m.id
WHERE ua.platform = 'DRW Skincare'
ORDER BY ua."createdAt" DESC
LIMIT 20;
```

### Check Points

```sql
-- Check total points earned from drwskincare
SELECT 
  m.email,
  SUM(ua."pointsEarned") as total_points_from_drw,
  COUNT(*) as total_activities
FROM "UserActivity" ua
JOIN members m ON ua."memberId" = m.id
WHERE ua.platform = 'DRW Skincare'
GROUP BY m.email
ORDER BY total_points_from_drw DESC
LIMIT 10;
```

---

## 🎉 Done! What's Next?

### Post-Integration Tasks

1. **Monitor Production**
   - Track error rates
   - Check activity tracking
   - Verify point accumulation

2. **User Communication**
   - Inform users about unified login
   - Explain point system benefits
   - Update help documentation

3. **Performance**
   - Monitor SSO API latency
   - Check token refresh rates
   - Optimize activity tracking

### Optional Enhancements

1. **Add More Activities**
   - Newsletter subscription
   - Social media sharing
   - Referral tracking
   - Cart abandonment recovery

2. **Enhanced User Experience**
   - Show points earned notifications
   - Display loyalty level
   - Points history page

3. **Analytics**
   - Track conversion rates
   - Activity heatmaps
   - User engagement metrics

---

## 📞 Support

**Questions during integration?**

- **Technical:** Contact berkomunitas tech team
- **Google OAuth:** Check Google Cloud Console docs
- **Testing:** Use berkomunitas staging environment

**Email:** tech@berkomunitas.com  
**Slack:** #sso-integration

---

## 📚 References

- [Berkomunitas SSO API Documentation](https://berkomunitas.com/docs/api)
- [SSO Quick Reference](../SSO_QUICK_REFERENCE.md)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Integration Time:** ~30 minutes  
**Difficulty:** ⭐ Easy  
**Status:** ✅ Ready to Integrate

**Good luck! 🚀**

---

*Last Updated: December 21, 2024*  
*Version: 1.0*  
*For: DRW Skincare Development Team*
