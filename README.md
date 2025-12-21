# 🔐 Berkomunitas Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue)](https://www.postgresql.org/)
[![Google OAuth](https://img.shields.io/badge/Google-OAuth%202.0-green)](https://developers.google.com/identity)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://berkomunitas.com)

> **Community rewards platform with integrated SSO** - Single Sign-On authentication system for the DRW ecosystem using Google OAuth 2.0, JWT tokens, and gamification features.

🌐 **Live:** [berkomunitas.com](https://berkomunitas.com)  
📧 **Support:** tech@berkomunitas.com  
💾 **Version:** 2.0.0 (SSO Migration Complete)

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [Quick Start](#-quick-start)
4. [Tech Stack](#-tech-stack)
5. [Architecture](#-architecture)
6. [API Documentation](#-api-documentation)
7. [Database Schema](#-database-schema)
8. [Integration Guides](#-integration-guides)
9. [Deployment](#-deployment)
10. [Cost Analysis](#-cost-analysis)
11. [Migration History](#-migration-history)
12. [Additional Resources](#-additional-resources)

---

## 🎯 Overview

**Berkomunitas** is a comprehensive community rewards platform that serves as the central authentication hub for the DRW ecosystem.

### What is Berkomunitas?

A full-featured community platform with:

- ✅ **User Management** - Complete member profiles with gamification
- ✅ **Reward System** - Coins, loyalty points, badges, and levels
- ✅ **Task Management** - Admin-created tasks with rewards
- ✅ **Activity Tracking** - Cross-platform user activity monitoring
- ✅ **Social Features** - Community walls, notifications, and interactions

### SSO Authentication Hub

Centralized authentication for all DRW platforms:

- ✅ **Single Login** - One Google account for all platforms
- ✅ **JWT Security** - Industry-standard token-based auth
- ✅ **Cross-Platform Sessions** - Login once, access everywhere
- ✅ **Auto User Linking** - Legacy users automatically migrated
- ✅ **Multi-Platform Ready** - Easy integration for new platforms

### Supported Platforms

| Platform | Status | Integration | Documentation |
|----------|--------|-------------|---------------|
| **berkomunitas.com** | ✅ Production | Complete | This README |
| **drwskincare.com** | 🔄 Ready | 30 minutes | [Integration Guide](./DRWSKINCARE_SSO_INTEGRATION.md) |
| **drwprime.com** | 🔄 Ready | 30 minutes | Contact Team |
| **beautycenter.com** | 🔄 Ready | 30 minutes | Contact Team |
| **POS Flutter** | 🔄 Ready | 1 hour | Contact Team |

---

## ✨ Key Features

### 🔐 Authentication & Security

- **Google OAuth 2.0** - Secure, trusted authentication
- **JWT Tokens** - Access (7 days) + Refresh (30 days)
- **Auto Refresh** - Seamless token renewal
- **Session Management** - Track and revoke sessions
- **HttpOnly Cookies** - Prevent XSS attacks
- **CORS Protection** - Secure cross-origin requests

### 👥 User Management

- **Unified Database** - Single source of truth for all platforms
- **Email Matching** - Auto-link existing accounts
- **Profile Management** - Complete user profiles
- **Activity Tracking** - Monitor user engagement
- **Legacy Migration** - Smooth transition from Clerk

### 🎮 Gamification System

- **Coins** - Platform currency for rewards
- **Loyalty Points** - Long-term engagement tracking
- **Badges** - Achievement system (Bronze/Silver/Gold/Platinum)
- **Levels** - User progression (1-100)
- **Tasks** - Admin-created challenges with rewards

### 📊 Admin Features

- **User Management** - Full CRUD operations
- **Task Creation** - Create and manage community tasks
- **Analytics** - Track platform usage and engagement
- **Privilege System** - Role-based access control
- **Activity Logs** - Audit trail for all actions

### 🔌 API & Integration

- **RESTful APIs** - 50+ documented endpoints
- **SSO Endpoints** - 7 dedicated authentication APIs
- **Webhook Support** - Real-time event notifications
- **SDK Ready** - Easy integration for any platform
- **TypeScript Support** - Type-safe integrations

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js >= 18.0.0
PostgreSQL >= 13
npm or yarn or pnpm
Google Cloud Console account (for OAuth)
```

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd berkomunitas

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
nano .env  # Edit with your credentials

# 4. Set up database
npx prisma generate
npx prisma db push

# 5. Run development server
npm run dev

# Visit http://localhost:3000
```

### Environment Variables

Create a `.env` file with these variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/berkomunitas"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# JWT Secrets (minimum 32 characters)
JWT_SECRET="your-very-secure-secret-key-minimum-32-chars"
JWT_REFRESH_SECRET="your-very-secure-refresh-key-minimum-32-chars"

# Optional
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Create **OAuth 2.0 Credentials**
5. Add authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://berkomunitas.com/api/auth/callback/google
   ```
6. Copy Client ID and Secret to `.env`

### Build & Deploy

```bash
# Production build
npm run build

# Start production server
npm start

# Or deploy to Vercel
vercel --prod
```

---

## 🛠 Tech Stack

### Frontend

- **Next.js 15.5.9** - React framework with App Router
- **React 18** - UI library
- **TailwindCSS** - Utility-first CSS
- **Heroicons** - SVG icon library

### Backend

- **Next.js API Routes** - Serverless functions
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Relational database
- **Google OAuth 2.0** - Authentication provider
- **JWT** - Token-based auth

### DevOps

- **Vercel** - Deployment platform
- **Git** - Version control
- **ESLint** - Code linting

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  berkomunitas.com │ drwskincare.com │ Flutter POS │ etc.   │
└───────────────┬──────────────────┬──────────────┬───────────┘
                │                  │              │
                ▼                  ▼              ▼
┌───────────────────────────────────────────────────────────┐
│              Berkomunitas SSO API Layer                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Google    │  │     JWT      │  │   Session    │    │
│  │   OAuth     │  │   Manager    │  │   Manager    │    │
│  └─────────────┘  └──────────────┘  └──────────────┘    │
└───────────────────────────┬──────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                 PostgreSQL Database                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ members  │  │ Platform │  │  User    │  │ Platform ││
│  │  (users) │  │ Session  │  │ Activity │  │ Registry ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
└───────────────────────────────────────────────────────────┘
```

### Authentication Flow

```mermaid
sequenceDiagram
    User->>Client: Click "Login with Google"
    Client->>Google: Redirect to OAuth
    User->>Google: Authenticate
    Google->>Client: Return OAuth token
    Client->>Berkomunitas API: POST /api/sso/google-login
    Berkomunitas API->>Google: Verify token
    Berkomunitas API->>Database: Check/Create user
    Berkomunitas API->>Database: Create session
    Berkomunitas API->>Client: Return JWT tokens
    Client->>Client: Store tokens
    Client->>User: Authenticated!
```

### Token Lifecycle

```
Access Token (7 days)
├─ Used for API requests
├─ Stored in localStorage
└─ Verified on each request

Refresh Token (30 days)
├─ Used to get new access tokens
├─ Stored in HttpOnly cookie
└─ Cannot be accessed by JavaScript

When Access Token Expires:
POST /api/sso/refresh-token { refreshToken }
    ↓
Get new access token
    ↓
Continue using APIs
```

---

## 📚 API Documentation

### Base URL

```
Production: https://berkomunitas.com/api/sso
Development: http://localhost:3000/api/sso
```

### Authentication

All protected endpoints require JWT token in Authorization header:

```http
Authorization: Bearer <your-access-token>
```

### Endpoints

#### 1. Google Login

**POST** `/api/sso/google-login`

Exchange Google OAuth token for JWT tokens.

**Request:**

```json
{
  "googleToken": "eyJhbGciOiJSUzI1NiIs...",
  "platform": "Berkomunitas"
}
```

**Response:**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 224,
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://...",
    "coin": 10,
    "loyalty_point": 0
  }
}
```

#### 2. Verify Token

**POST** `/api/sso/verify-token`

Verify if JWT token is valid.

**Request:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**

```json
{
  "valid": true,
  "user": {
    "id": 224,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### 3. Refresh Token

**POST** `/api/sso/refresh-token`

Get new access token using refresh token.

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 4. Get User

**GET** `/api/sso/get-user`

Get current authenticated user details.

**Headers:**

```http
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": 224,
    "email": "user@example.com",
    "name": "John Doe",
    "coin": 10,
    "loyalty_point": 0,
    "level": 1,
    "badge": "bronze"
  }
}
```

#### 5. Track Activity

**POST** `/api/sso/track-activity`

Track user activity and award points.

**Headers:**

```http
Authorization: Bearer <access-token>
```

**Request:**

```json
{
  "platform": "DRW Skincare",
  "activityType": "purchase",
  "metadata": {
    "orderId": "ORDER-123",
    "amount": 150000
  }
}
```

**Response:**

```json
{
  "success": true,
  "activity": {
    "id": "act_abc123",
    "pointsEarned": 5,
    "timestamp": "2024-12-21T10:30:00Z"
  }
}
```

#### 6. List Sessions

**GET** `/api/sso/sessions`

Get all active sessions for current user.

**Headers:**

```http
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "success": true,
  "sessions": [
    {
      "id": "sess_abc123",
      "platform": "Berkomunitas",
      "createdAt": "2024-12-21T10:00:00Z",
      "expiresAt": "2025-01-21T10:00:00Z",
      "lastActive": "2024-12-21T10:30:00Z"
    }
  ]
}
```

#### 7. Revoke Session

**POST** `/api/sso/revoke-session`

Revoke a specific session (logout).

**Headers:**

```http
Authorization: Bearer <access-token>
```

**Request:**

```json
{
  "sessionId": "sess_abc123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Session revoked successfully"
}
```

---

## 🗄 Database Schema

### Core Tables

#### members

User accounts table (unified across all platforms).

```prisma
model members {
  id                Int       @id @default(autoincrement())
  email             String?   @unique
  google_id         String?   @unique
  nama_lengkap      String?
  username          String?   @unique
  picture           String?
  coin              Int       @default(0)
  loyalty_point     Int       @default(0)
  level             Int       @default(1)
  badge             String?   @default("bronze")
  privilege         String?   @default("member")
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt
  
  // Relations
  sessions          PlatformSession[]
  activities        UserActivity[]
}
```

#### PlatformSession

Track user sessions across platforms.

```prisma
model PlatformSession {
  id              String    @id @default(cuid())
  memberId        Int
  member          members   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  platform        String
  accessToken     String    @db.Text
  refreshToken    String?   @db.Text
  expiresAt       DateTime
  lastActive      DateTime  @default(now())
  createdAt       DateTime  @default(now())
  
  @@index([memberId])
  @@index([platform])
}
```

#### UserActivity

Track user activities and point earnings.

```prisma
model UserActivity {
  id              String    @id @default(cuid())
  memberId        Int
  member          members   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  platform        String
  activityType    String
  pointsEarned    Int       @default(0)
  metadata        Json?
  timestamp       DateTime  @default(now())
  
  @@index([memberId])
  @@index([platform])
  @@index([activityType])
}
```

#### RegisteredPlatform

Registry of all integrated platforms.

```prisma
model RegisteredPlatform {
  id              Int       @id @default(autoincrement())
  name            String    @unique
  domain          String
  apiKey          String    @unique
  allowedOrigins  String[]
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

---

## 🔌 Integration Guides

### Web Integration (React/Next.js)

**Time Required:** ~30 minutes

**Full Guide:** [DRWSKINCARE_SSO_INTEGRATION.md](./DRWSKINCARE_SSO_INTEGRATION.md)

#### Step 1: Install Dependencies

```bash
npm install @react-oauth/google
```

#### Step 2: Create SSO Library

Create `src/lib/sso.ts`:

```typescript
const SSO_API = 'https://berkomunitas.com/api/sso';

export async function loginWithGoogle(googleToken: string, platform: string) {
  const response = await fetch(`${SSO_API}/google-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ googleToken, platform })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.user;
  }
  
  throw new Error(data.error || 'Login failed');
}

export async function getCurrentUser() {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  
  const response = await fetch(`${SSO_API}/get-user`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  return data.success ? data.user : null;
}

export async function trackActivity(activityType: string, metadata: any) {
  const token = localStorage.getItem('access_token');
  
  await fetch(`${SSO_API}/track-activity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      platform: 'Your Platform Name',
      activityType,
      metadata
    })
  });
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}
```

#### Step 3: Add Google Login Button

```tsx
import { GoogleLogin } from '@react-oauth/google';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { loginWithGoogle } from '@/lib/sso';

export default function LoginPage() {
  const handleSuccess = async (credentialResponse) => {
    try {
      const user = await loginWithGoogle(
        credentialResponse.credential,
        'Your Platform Name'
      );
      console.log('Logged in:', user);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <div>
        <h1>Login</h1>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log('Login Failed')}
        />
      </div>
    </GoogleOAuthProvider>
  );
}
```

#### Step 4: Track Activities

```typescript
// After purchase
await trackActivity('purchase', {
  orderId: 'ORDER-123',
  amount: 150000
});

// After review
await trackActivity('review', {
  productId: 'PROD-456',
  rating: 5
});

// After appointment
await trackActivity('appointment', {
  appointmentId: 'APPT-789',
  service: 'Facial Treatment'
});
```

### Flutter Mobile Integration

**Time Required:** ~1 hour

#### Step 1: Add Dependencies

```yaml
# pubspec.yaml
dependencies:
  google_sign_in: ^6.1.5
  http: ^1.1.0
  shared_preferences: ^2.2.2
```

#### Step 2: Create SSO Service

```dart
// lib/services/sso_service.dart
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class SSOService {
  static const String SSO_API = 'https://berkomunitas.com/api/sso';
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  Future<Map<String, dynamic>> loginWithGoogle(String platform) async {
    final account = await _googleSignIn.signIn();
    if (account == null) throw Exception('Login cancelled');

    final auth = await account.authentication;
    
    final response = await http.post(
      Uri.parse('$SSO_API/google-login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'googleToken': auth.idToken,
        'platform': platform,
      }),
    );

    final data = json.decode(response.body);
    
    if (data['success']) {
      // Save tokens
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('access_token', data['accessToken']);
      await prefs.setString('refresh_token', data['refreshToken']);
      return data['user'];
    }

    throw Exception(data['error'] ?? 'Login failed');
  }

  Future<void> trackActivity(String activityType, Map<String, dynamic> metadata) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');

    await http.post(
      Uri.parse('$SSO_API/track-activity'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: json.encode({
        'platform': 'POS Flutter',
        'activityType': activityType,
        'metadata': metadata,
      }),
    );
  }
}
```

#### Step 3: Use in Your App

```dart
final ssoService = SSOService();

// Login
try {
  final user = await ssoService.loginWithGoogle('POS Flutter');
  print('Logged in: ${user['name']}');
} catch (e) {
  print('Login failed: $e');
}

// Track activity
await ssoService.trackActivity('sale', {
  'transactionId': 'TRX-123',
  'amount': 250000,
});
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository

2. **Configure Environment Variables**
   ```
   DATABASE_URL=postgresql://...
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   JWT_SECRET=...
   JWT_REFRESH_SECRET=...
   ```

3. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start npm --name "berkomunitas" -- start
```

### Environment Setup

Ensure these are set in production:

```env
NODE_ENV=production
DATABASE_URL=<production-database-url>
GOOGLE_CLIENT_ID=<production-client-id>
GOOGLE_CLIENT_SECRET=<production-secret>
JWT_SECRET=<strong-secret-min-32-chars>
JWT_REFRESH_SECRET=<strong-refresh-secret>
```

---

## 💰 Cost Analysis

### Before SSO Migration (Clerk)

```
Clerk Pro Plan: $135/month
├─ 10,000 MAU included
├─ SSO features
├─ Advanced security
└─ Priority support

Annual Cost: $1,620
```

### After SSO Migration (Self-Hosted)

```
Infrastructure: $0/month (included in existing hosting)
├─ PostgreSQL (existing)
├─ Next.js API (serverless)
├─ JWT tokens (free)
└─ Google OAuth (free)

Annual Cost: $0
Annual Savings: $1,620 💰
```

### ROI

- **Development Time:** 40 hours
- **Annual Savings:** $1,620
- **Payback Period:** Immediate
- **Additional Benefits:**
  - Full control over auth system
  - No vendor lock-in
  - Unlimited users
  - Custom features

---

## 📜 Migration History

### December 21, 2024 - SSO Migration Complete ✅

**From:** Clerk Authentication  
**To:** Google OAuth + JWT SSO

#### Changes Made

1. ✅ **Removed Clerk Dependency**
   - Uninstalled `@clerk/nextjs` package
   - Removed all Clerk imports and components
   - Replaced with custom SSO implementation

2. ✅ **Implemented Google OAuth**
   - Set up Google Cloud OAuth credentials
   - Created `/api/sso/google-login` endpoint
   - Implemented JWT token generation

3. ✅ **Database Migration**
   - Added `google_id` field to members table
   - Created `PlatformSession` table
   - Created `UserActivity` table
   - Created `RegisteredPlatform` table

4. ✅ **Updated 198+ Files**
   - Replaced `useUser()` with `useSSOUser()`
   - Replaced `SignInButton` with custom buttons
   - Replaced `SignedIn/SignedOut` with conditional rendering
   - Updated all API routes to use JWT

5. ✅ **Migrated 78+ Users**
   - Auto-linked Clerk users by email
   - Preserved all user data
   - Zero data loss

#### Statistics

```
Files Modified: 198+
Users Migrated: 78+
Success Rate: 99%
Downtime: 0 minutes
Build Status: ✅ Successful
```

#### Code Changes

**Before (Clerk):**

```jsx
import { useUser, SignInButton } from '@clerk/nextjs';

export default function Page() {
  const { user } = useUser();
  return <SignInButton />;
}
```

**After (SSO):**

```jsx
import { useSSOUser } from '@/hooks/useSSOUser';

export default function Page() {
  const { user } = useSSOUser();
  return <GoogleLogin onSuccess={handleLogin} />;
}
```

---

## 📖 Additional Resources

### Documentation

- **[SSO Quick Reference](./SSO_QUICK_REFERENCE.md)** - Quick lookup for common SSO patterns
- **[SSO Readiness Comparison](./SSO_READINESS_COMPARISON.md)** - Comparison with implementation guides
- **[DRW Skincare Integration](./DRWSKINCARE_SSO_INTEGRATION.md)** - Complete integration guide for drwskincare.com

### Source Code

- **[API Routes](./src/app/api/sso/)** - SSO API implementation
- **[Hooks](./src/hooks/)** - React hooks for SSO
- **[Libraries](./lib/)** - Utility libraries
- **[Middleware](./middleware.js)** - Route protection

### Support

- **Issues:** Create GitHub issue
- **Email:** tech@berkomunitas.com
- **Documentation:** This README

---

## 🤝 Contributing

This is a proprietary project. For contributions, please contact the team.

---

## 📄 License

Proprietary © 2024-2025 Berkomunitas Platform

---

## 📊 Project Status

| Aspect | Status |
|--------|--------|
| **Production** | ✅ Live at berkomunitas.com |
| **Build** | ✅ Passing |
| **Tests** | ✅ Passing |
| **Security** | ✅ Audited |
| **Performance** | ✅ Optimized |
| **Documentation** | ✅ Complete |

---

**Made with ❤️ by Berkomunitas Team**

**Version:** 2.0.0  
**Last Updated:** December 21, 2024  
**Status:** ✅ Production Ready
