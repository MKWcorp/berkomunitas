# 📙 DOKUMENTASI 3: API ENDPOINTS & BACKEND LIBRARIES

## Berkomunitas — 117 API Endpoints + 15 Backend Libraries

> Dokumen ini menjelaskan SETIAP API endpoint (HTTP method, auth, request/response format), dan semua library backend (function signatures, parameters, return values).

---

## Daftar Isi

1. [API Architecture Overview](#1-api-architecture-overview)
2. [Authentication Patterns](#2-authentication-patterns)
3. [SSO Endpoints (7)](#3-sso-endpoints)
4. [Admin Endpoints (35)](#4-admin-endpoints)
5. [Profile Endpoints (16)](#5-profile-endpoints)
6. [Task Endpoints (7)](#6-task-endpoints)
7. [Reward Endpoints (4)](#7-reward-endpoints)
8. [Leaderboard & Dashboard (4)](#8-leaderboard--dashboard)
9. [Notifications, Events, Privileges (7)](#9-notifications-events-privileges)
10. [BerkomunitasPlus & DRW Integration (14)](#10-berkomunitasplus--drw-integration)
11. [Utility & System (6)](#11-utility--system)
12. [Webhooks & Debug (9)](#12-webhooks--debug)
13. [Backend Libraries Detail](#13-backend-libraries-detail)
14. [API Coding Patterns & Templates](#14-api-coding-patterns--templates)

---

## 1. API Architecture Overview

- **Format:** Next.js App Router API Routes (`src/app/api/**/route.js`)
- **Protocol:** REST (JSON request/response)
- **Auth:** Custom SSO JWT (bukan next-auth)
- **ORM:** Prisma Client (singleton dari `@/lib/prisma`)
- **Error Handling:** Per-route try/catch, return JSON error
- **Timeout:** 30 detik maximum (vercel.json)
- **Total:** 117 endpoints

### Response Format Convention

```javascript
// Success
{ "success": true, "data": {...}, "message": "..." }
// atau langsung data object tanpa wrapper

// Error
{ "error": "Error message", "success": false }
// atau
{ "error": "Error message", "details": "..." }
```

⚠️ **Tidak ada standard response wrapper.** Format bervariasi per endpoint.

---

## 2. Authentication Patterns

### Pattern 1: `getCurrentUser(request)` — Server-side SSO Auth

```javascript
import { getCurrentUser } from '@/lib/ssoAuth';

export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // user = { id, email, name, ... }
}
```

**Cara kerja:**
1. Baca cookie `sso_token` ATAU header `Authorization: Bearer <token>`
2. Verify JWT dengan `jsonwebtoken` library
3. Return decoded token payload (memberId, email, name)
4. Return null jika invalid/expired

### Pattern 2: `requireAdmin()` — Admin Middleware

```javascript
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET(request) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck.error) {
    return Response.json({ error: adminCheck.error }, { status: adminCheck.status });
  }
  // adminCheck.user berisi data user
}
```

**Cara kerja:**
1. Panggil `getCurrentUser(request)` dulu
2. Query `user_privileges` table: privilege = 'admin' AND is_active = true
3. Check `expires_at` (null = permanent, atau harus di masa depan)

### Pattern 3: Bearer JWT Header

```javascript
const authHeader = request.headers.get('authorization');
const token = authHeader?.replace('Bearer ', '');
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Pattern 4: `x-user-email` Header (Legacy/Weak)

```javascript
const email = request.headers.get('x-user-email');
// ⚠️ Tidak ada verifikasi — siapapun bisa spoof header ini
```

### Pattern 5: No Auth (Public)

Endpoint terbuka tanpa autentikasi.

---

## 3. SSO Endpoints

### 3.1 `POST /api/sso/google-login` ⭐

Login dengan Google OAuth token.

| Item | Detail |
|------|--------|
| **Auth** | None (ini endpoint login) |
| **Rate Limit** | Tidak ada |

**Request:**
```json
{
  "googleToken": "eyJhbGciOiJSUzI1NiIs...",    // Google OAuth ID token
  "platform": "Berkomunitas"                      // optional, default: "Berkomunitas"
}
```

**Response (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",     // JWT, 7 hari
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",    // JWT, 30 hari
  "user": {
    "id": 123,
    "email": "user@gmail.com",
    "name": "Nama User",
    "photo": "https://minio.../profile.jpg",
    "coin": 150,
    "loyaltyPoint": 200
  }
}
```

**Cookies Set:** `access_token` (HttpOnly, 7d), `refresh_token` (HttpOnly, 30d)

**Side Effects:**
- Create/update member record (upsert by email → fallback google_id)
- +1 coin, +1 loyalty_point
- Create `coin_history` + `loyalty_point_history` records
- Create `PlatformSession` record
- Create `UserActivity` record (type: "login")
- Auto-link Clerk accounts by email → sets `google_id`

**Errors:** 400 (missing token), 401 (invalid Google token), 500

---

### 3.2 `POST /api/sso/verify-token`

Verify JWT access token dan return user data.

**Request:**
```json
{ "token": "eyJhbGciOiJIUzI1NiIs..." }
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 123,
    "email": "user@gmail.com",
    "name": "Nama User",
    "photo": "https://...",
    "googleId": "google-id",
    "coin": 150,
    "loyaltyPoint": 200,
    "isAdmin": true,
    "lastLoginAt": "2024-01-01T00:00:00Z"
  }
}
```

**Side Effects:** Updates `last_activity_at` on matching PlatformSession (fire-and-forget)

---

### 3.3 `POST /api/sso/refresh-token`

Refresh expired access token.

**Request:**
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiIs..." }
```

**Response (200):**
```json
{
  "success": true,
  "accessToken": "new-jwt-token..."
}
```

**Side Effects:** Updates PlatformSession with new jwt_token, extends expires_at 7 days. Does NOT set cookies.

---

### 3.4 `GET /api/sso/get-user`

Get full user data from JWT.

| Auth | `Authorization: Bearer <accessToken>` |
|------|------|

**Response (200):**
```json
{
  "id": 123,
  "email": "user@gmail.com",
  "googleId": "...",
  "fullName": "Nama User",
  "imageUrl": "https://minio.../photo.jpg",
  "whatsapp": "08123456789",
  "coin": 150,
  "loyaltyPoint": 200,
  "bio": "...",
  "status": "custom status",
  "registeredAt": "...",
  "lastLoginAt": "...",
  "username": "namauser",
  "displayName": "Nama Display"
}
```

Note: Looks up user by **email** dari JWT, bukan ID. Falls back to `ui-avatars.com` jika no photo.

---

### 3.5 `GET /api/sso/sessions`

List semua active sessions user.

| Auth | `getCurrentUser(request)` |
|------|------|

**Response (200):**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "uuid",
      "isCurrent": true,
      "userAgent": "Mozilla/5.0...",
      "deviceType": "desktop",
      "ipAddress": "1.2.3.4",
      "createdAt": "...",
      "lastActivityAt": "...",
      "expiresAt": "..."
    }
  ]
}
```

---

### 3.6 `POST /api/sso/revoke-session`

Revoke (hapus) session.

**Request:**
```json
{ "sessionId": "123" }
```

**Response (200):**
```json
{
  "success": true,
  "message": "Session revoked successfully",
  "isCurrentSession": false
}
```

Jika revoke current session → cookies `sso_token` dan `sso_refresh_token` dihapus.

---

### 3.7 `POST /api/sso/track-activity`

Track user activity dan berikan poin.

| Auth | `Authorization: Bearer <accessToken>` |
|------|------|

**Request:**
```json
{
  "activityType": "post_comment",
  "platform": "Berkomunitas",
  "metadata": { "postId": "123" }
}
```

**Activity Types & Points:**

| Type | Points |
|------|--------|
| `login` | 1 |
| `purchase` | 10 |
| `review` | 5 |
| `referral` | 20 |
| `post_comment` | 3 |
| `share` | 2 |
| `course_complete` | 15 |
| `appointment_book` | 5 |
| `task_complete` | 10 |
| `daily_check_in` | 2 |
| `profile_complete` | 5 |

**Response (200):**
```json
{
  "success": true,
  "pointsEarned": 3,
  "activityType": "post_comment"
}
```

---

## 4. Admin Endpoints

### 4.1 Dashboard & Auth Check

| # | Endpoint | Methods | Deskripsi |
|---|----------|---------|-----------|
| 1 | `/api/admin/check` | GET | Check admin privilege |
| 2 | `/api/admin/check-status` | GET | Admin status + member info |
| 3 | `/api/admin/dashboard` | GET | Statistics: 13 queries, global stats, charts, leaderboards |
| 4 | `/api/admin/stats/overview` | GET | ⚠️ Mock data (TODO) |
| 5 | `/api/admin/stats/members` | GET | ⚠️ Mock data (TODO) |

**`GET /api/admin/dashboard` Response:**
```json
{
  "statistik_global": [...],
  "statistik_harian": [...],           // Last 30 days
  "total_tugas": 150,
  "total_hadiah": 25,
  "total_lencana": 10,
  "total_komentar": 50000,
  "total_loyalty": 100000,
  "total_coin": 85000,
  "chart_data": [{ "tanggal": "...", "total_komentar_harian": 100, "total_loyalty_harian": 500 }],
  "peringkat_comments": [...],         // Top 10
  "peringkat_loyalty": [...],          // Top 10
  "peringkat_tugas": [...],
  "peringkat_sumber": [...]
}
```

### 4.2 Members Management

| # | Endpoint | Methods | Deskripsi |
|---|----------|---------|-----------|
| 6 | `/api/admin/members` | GET | List all members + usernames, emails, social media |
| 7 | `/api/admin/members/[id]` | GET, PUT, DELETE | CRUD specific member |

**`GET /api/admin/members` Response:** Array of members with: usernames, emails, social media, privileges, badges.

**`PUT /api/admin/members/[id]` Request:**
```json
{
  "nama_lengkap": "Updated Name",
  "email": "new@email.com",
  "nomer_wa": "08123456789",
  "loyalty_point": 500,
  "coin": 300
}
```

### 4.3 Tasks Management

| # | Endpoint | Methods | Deskripsi |
|---|----------|---------|-----------|
| 8 | `/api/admin/tugas` | GET, POST | List/create comment tasks (tugas_ai) |
| 9 | `/api/admin/tugas/[id]` | GET, PUT, DELETE | CRUD specific task |
| 10 | `/api/admin/tugas/stats` | GET | Task statistics |
| 11 | `/api/admin/tugas-ai-2` | GET, POST | List/create screenshot tasks (tugas_ai_2) |
| 12 | `/api/admin/tugas-ai-2/[id]` | GET, PUT, DELETE | CRUD specific screenshot task |
| 13 | `/api/admin/task-submissions/[id]` | PUT | Approve/reject submission + give points |

**`POST /api/admin/tugas` Request:**
```json
{
  "keyword_tugas": "DRW Skincare terbaik",
  "deskripsi_tugas": "Comment tentang pengalaman pakai DRW",
  "link_postingan": "https://instagram.com/p/xxx",
  "point_value": 15,
  "status": "tersedia"
}
```

**`PUT /api/admin/task-submissions/[id]` Request:**
```json
{
  "status_submission": "selesai",     // atau "gagal"
  "admin_notes": "Verified by admin"
}
```

Side effects saat approve: +coin, +loyalty_point, create history, send notification.

### 4.4 Rewards Management

| # | Endpoint | Methods | Deskripsi |
|---|----------|---------|-----------|
| 14 | `/api/admin/rewards` | GET, POST | List/create rewards |
| 15 | `/api/admin/rewards/[id]` | PUT, DELETE | Update/delete reward |
| 16 | `/api/admin/rewards/upload-foto` | POST | Upload reward image (5MB max) |
| 17 | `/api/admin/reward-categories` | POST | Create reward category |
| 18 | `/api/admin/redemptions` | GET | List all redemptions |
| 19 | `/api/admin/redemptions/[id]/status` | PUT | Update redemption status ⚠️ No auth |

**`POST /api/admin/rewards` Request:**
```json
{
  "reward_name": "Voucher Belanja 50K",
  "description": "Voucher belanja di toko DRW",
  "point_cost": 500,
  "stock": 10,
  "category_id": 1,
  "is_exclusive": false,
  "required_privilege": null
}
```

### 4.5 Points & Coins Management

| # | Endpoint | Methods | Deskripsi |
|---|----------|---------|-----------|
| 20 | `/api/admin/points` | GET | Loyalty point history + member details |
| 21 | `/api/admin/points/correction` | POST | Manual point correction |
| 22 | `/api/admin/points/manual` | POST | Add points manually |
| 23 | `/api/admin/coins` | GET | Coin transaction history |
| 24 | `/api/admin/coins/manual` | POST | Add coins manually |

**`POST /api/admin/points/manual` Request:**
```json
{
  "member_id": 123,
  "points": 100,
  "event": "Manual point addition by admin",
  "event_type": "admin"
}
```

### 4.6 Badges, Levels, Privileges, Social Media

| # | Endpoint | Methods | Deskripsi |
|---|----------|---------|-----------|
| 25 | `/api/admin/badges` | GET, POST | Badge CRUD |
| 26 | `/api/admin/badges/[id]` | PUT, DELETE | - |
| 27 | `/api/admin/member-badges` | GET | List assigned badges |
| 28 | `/api/admin/member-badges/[id]` | DELETE | Remove badge |
| 29 | `/api/admin/member-badges/batch` | POST | Batch assign |
| 30 | `/api/admin/member-badges/remove` | DELETE | Remove by URL params |
| 31 | `/api/admin/levels` | GET, POST | Level CRUD |
| 32 | `/api/admin/levels/[id]` | PUT, DELETE | - |
| 33 | `/api/admin/privileges` | GET, POST | Privilege CRUD |
| 34 | `/api/admin/privileges/[id]` | PUT, DELETE | - |
| 35 | `/api/admin/social-media` | GET, POST | Social media CRUD |
| 36 | `/api/admin/social-media/[id]` | PUT, DELETE | - |
| 37 | `/api/admin/generate-photos` | POST, GET | Generate DiceBear avatars |
| 38 | `/api/admin/backfill-clerk-ids` | GET | **DEPRECATED** (returns 410) |

---

## 5. Profile Endpoints

| # | Endpoint | Methods | Auth | Deskripsi |
|---|----------|---------|------|-----------|
| 1 | `/api/profil` | GET,POST,PUT,PATCH | SSO | Full profile CRUD |
| 2 | `/api/profil/[username]` | GET | Public | Public profile by username |
| 3 | `/api/profil/dashboard` | GET | SSO | Dashboard data (creates member if missing) |
| 4 | `/api/profil/email` | GET | SSO | Get email |
| 5 | `/api/profil/loyalty` | GET | SSO | Loyalty + coin balance |
| 6 | `/api/profil/username` | GET,POST,PUT,DELETE | SSO | Username CRUD |
| 7 | `/api/profil/upload-foto` | POST | SSO | Upload profile picture |
| 8 | `/api/profil/sosial-media` | GET,POST,DELETE | SSO | Social media profiles |
| 9 | `/api/profil/sosial-media/[id]` | DELETE | SSO | Delete social media |
| 10 | `/api/profil/sosial-media/check-availability` | POST | SSO | Check username availability |
| 11 | `/api/profil/check-completeness` | GET,POST | SSO/None | Profile completeness check |
| 12 | `/api/profil/check-duplicate` | POST | SSO | Check duplicate accounts |
| 13 | `/api/profil/merge-account` | POST | SSO | Merge duplicate accounts |
| 14 | `/api/profil/wall` | POST | SSO | Post on profile wall |
| 15 | `/api/profil/rewards-history` | GET | SSO | Reward redemption history |
| 16 | `/api/profil/rewards-history/[id]/confirm` | POST | SSO | Confirm reward receipt |

### Key Profile Endpoints Detail

**`POST /api/profil/upload-foto` — Upload Profile Picture ⭐**

Cascade upload: MinIO → VPS → Cloudinary → Local

**Request:** `FormData` with `file` field (max 5MB, image/jpeg|png|gif|webp)

**Response (200):**
```json
{
  "success": true,
  "url": "https://minio.../profile-pictures/upload_1700000000.jpg",
  "storage": "minio"
}
```

**`GET /api/profil/check-completeness`**

**Response (200):**
```json
{
  "isComplete": false,
  "missing": ["nomer_wa", "social_media"],
  "member": {
    "nama_lengkap": "User Name",
    "nomer_wa": null,
    "social_media_count": 0
  }
}
```

Completeness criteria: `nama_lengkap` + `nomer_wa` + minimal 1 social media.

---

## 6. Task Endpoints

| # | Endpoint | Methods | Auth | Deskripsi |
|---|----------|---------|------|-----------|
| 1 | `/api/tugas` | GET | SSO | List tasks + member submission status |
| 2 | `/api/tugas/[id]` | GET | Public | Task detail |
| 3 | `/api/tugas/[id]/screenshot` | POST | SSO | Upload screenshot (tugas_ai_2) **→ triggers n8n** |
| 4 | `/api/tugas/stats` | GET,POST | SSO | Task stats (get/recalculate) |
| 5 | `/api/tugas-ai-2/[id]` | GET | Optional SSO | Screenshot task detail |
| 6 | `/api/tugas-ai-2/[id]/kerjakan` | POST | SSO | Mulai kerjakan task, buat submission record |
| 7 | `/api/task-submissions` | GET | SSO | Member's submissions |
| 8 | `/api/task-submissions/timeout` | POST | SSO | Mark task as timed out |
| 9 | `/api/n8n/screenshot-callback` | POST | N8n Secret | N8n AI callback → update status + award points |
| 10 | `/api/n8n/tiktok-to-tugas` | POST | N8n Secret | N8n creates tugas from new TikTok content |

### Key Task Endpoints Detail

---

**`POST /api/tugas-ai-2/[id]/kerjakan` — Mulai Kerjakan Task ⭐**

Endpoint ini harus dipanggil sebelum mengupload screenshot. Membuat record `tugas_ai_2_submissions` dan menghitung deadline.

**Auth:** SSO cookie required

**Response (200):**
```json
{
  "success": true,
  "submission_id": 123,
  "link_postingan": "https://vt.tiktok.com/xxx",
  "batas_waktu": "2025-01-28T12:00:00.000Z",
  "keyword_tugas": "@drwskincare #DRWSkincare",
  "status": "dikerjakan"
}
```

**Side Effects:**
- Create `tugas_ai_2_submissions` record, status `dikerjakan`
- Set `waktu_klik = now()`, `batas_waktu = now() + 24h`
- Opens task link in new tab (frontend side)

---

**`POST /api/tugas/[id]/screenshot` — Upload Screenshot Bukti ⭐**

**Prerequisite:** User must have called `kerjakan` first (active submission required)

**Request:** `FormData` with:
- `screenshot` — File (max 5MB)
- `comment_link` — Link komentar sebagai bukti (optional)

**Response (200):**
```json
{
  "success": true,
  "message": "Screenshot uploaded successfully",
  "data": {
    "screenshotId": 456,
    "status": "sedang_verifikasi",
    "deadline": "2025-01-28T16:00:00.000Z"
  }
}
```

**Side Effects:**
- Gate check: active submission must exist + not expired
- Upload screenshot to MinIO (`screenshots/task/...`)
- Create `tugas_ai_2_screenshots` record linked to submission
- Advance submission status → `sedang_verifikasi`
- Fire `N8N_SCREENSHOT_VERIFICATION_WEBHOOK` (fire-and-forget) with full payload

**n8n webhook payload:**
```json
{
  "screenshotId": 456,
  "submissionId": 123,
  "taskId": 1,
  "memberId": 789,
  "platform": "tiktok",
  "screenshotUrl": "https://storage.berkomunitas.com/...",
  "commentLink": "https://vt.tiktok.com/...",
  "keyword": "@drwskincare",
  "verificationRules": { "platform": "tiktok", "min_confidence": 70 },
  "callbackUrl": "https://berkomunitas.com/api/n8n/screenshot-callback"
}
```

---

**`GET /api/tugas` — List Tasks**

**Query Params:**
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 10)
- `filter` — Status filter: `semua` | `selesai` | `belum` | `verifikasi`
- `source` — Platform filter: `tiktok` | `facebook` | `instagram` (omit = all)
- `search` — Free text search in deskripsi_tugas

**Response (200):**
```json
{
  "success": true,
  "tasks": [
    {
      "id": 1,
      "keyword_tugas": "#DRWSkincare",
      "task_type": "screenshot",
      "source": "tiktok",
      "status_submission": "tersedia",
      "submission_data": {
        "id": 123,
        "status": "dikerjakan",
        "batas_waktu": "2025-01-28T12:00:00Z",
        "verification_attempts": 0,
        "max_retries": 3
      },
      "screenshot_data": null
    }
  ],
  "memberId": 789,
  "pagination": { "page": 1, "limit": 10, "totalTasks": 45, "totalPages": 5 }
}
```

---

**`POST /api/n8n/screenshot-callback` — N8n AI Verification Callback ⭐**

N8n menggunakan OCR / AI untuk memverifikasi screenshot, lalu memanggil endpoint ini dengan hasilnya.

**Auth:** Header `x-n8n-secret: <N8N_WEBHOOK_SECRET>` atau `Authorization: Bearer <secret>`

**Request Body:**
```json
{
  "screenshotId": 456,
  "submissionId": 123,
  "status": "selesai",
  "ai_confidence": 92,
  "ai_text": "Teks yang diekstrak dari screenshot",
  "notes": "Keyword ditemukan, komentar valid",
  "n8n_execution_id": "exec_abc123"
}
```

**`status` values:** `selesai` (approved) | `gagal` (rejected)

**Response (200):**
```json
{
  "success": true,
  "message": "Screenshot approved and points awarded",
  "data": {
    "screenshotId": 456,
    "submissionId": 123,
    "status": "selesai",
    "memberId": 789,
    "pointValue": 10
  }
}
```

**Side Effects (when approved):**
- Update `tugas_ai_2_screenshots.status` → `selesai`
- Update `tugas_ai_2_submissions.status` → `selesai`, set `waktu_selesai`
- Update `member_stats` (total_points + point_value, completed_tasks + 1)
- Create `coin_transactions` record

---

**`POST /api/n8n/tiktok-to-tugas` — N8n Create Task from TikTok Content ⭐**

N8n memanggil endpoint ini setelah scraping konten TikTok baru, untuk otomatis membuat task `tugas_ai_2`.

**Auth:** Header `x-n8n-secret: <N8N_WEBHOOK_SECRET>`

**Request Body:**
```json
{
  "content_id": "7300000000000000000",
  "author_username": "drwskincare",
  "description": "Coba produk baru DRW Skincare...",
  "video_url": "https://vt.tiktok.com/xxx",
  "like_count": 1500,
  "comment_count": 230,
  "keyword_tugas": "@drwskincare #DRWSkincare",
  "point_value": 15,
  "expires_hours": 72
}
```

**Response (200) — created:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "created": true,
    "taskId": 55,
    "tiktokContentId": 12,
    "keyword_tugas": "@drwskincare #DRWSkincare",
    "point_value": 15,
    "expires_at": "2025-01-31T00:00:00.000Z"
  }
}
```

**Response (200) — already exists:**
```json
{ "success": true, "message": "Task already exists for this TikTok content", "data": { "created": false, "taskId": 55 } }
```

**Side Effects:**
- Upsert `tiktok_contents` record (by `content_id`)
- Create `tugas_ai_2` record with `source: 'tiktok'`, `tiktok_content_id`
- Idempotent: second call for same `content_id` returns existing task, no duplicate

---

## 7. Reward Endpoints

| # | Endpoint | Methods | Auth | Deskripsi |
|---|----------|---------|------|-----------|
| 1 | `/api/rewards/redeem` | POST | SSO | Redeem reward (costs coin) |
| 2 | `/api/rewards/access-test` | GET | No | Test privilege access |
| 3 | `/api/rewards-by-category` | GET | No | Browse rewards by category |
| 4 | `/api/reward-categories` | GET,POST,PUT,DELETE | Mixed | Category CRUD |

**`POST /api/rewards/redeem` ⭐**

**Request:**
```json
{
  "reward_id": 5,
  "quantity": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Reward berhasil diredeem",
  "redemption": {
    "id": 789,
    "points_spent": 500,
    "status": "menunggu_verifikasi"
  },
  "remaining_coin": 100
}
```

**Side Effects:**
- Deduct coin from member
- Decrease reward stock
- Create `reward_redemptions` record
- Create `coin_history` record (debit)
- Send notification to member

---

## 8. Leaderboard & Dashboard

| # | Endpoint | Methods | Auth | Deskripsi |
|---|----------|---------|------|-----------|
| 1 | `/api/leaderboard` | GET | No | Leaderboard (cached 30s) |
| 2 | `/api/leaderboard/infinite` | GET | No | Infinite scroll with pagination |
| 3 | `/api/ranking/leaderboard` | GET | No | Legacy leaderboard with member data |
| 4 | `/api/dashboard` | GET | No | Public dashboard stats (cached 5s) |

**`GET /api/leaderboard` Response:**
```json
{
  "loyalty_leaderboard": [
    {
      "peringkat": 1,
      "id_member": 123,
      "nama_lengkap": "Top User",
      "total_loyalty_point": 10500,
      "foto_profil_url": "..."
    }
  ],
  "comment_leaderboard": [...]
}
```

---

## 9. Notifications, Events, Privileges

| # | Endpoint | Methods | Auth | Deskripsi |
|---|----------|---------|------|-----------|
| 1 | `/api/notifikasi` | GET,POST,DELETE | SSO | Get/mark-read/delete notifications |
| 2 | `/api/events` | GET,POST | SSO+Admin | List/create events |
| 3 | `/api/events/[setting_name]` | PUT,DELETE | Admin | Update/delete event |
| 4 | `/api/events/public` | GET | No | Public active events |
| 5 | `/api/privileges` | GET,POST,DELETE | SSO | Privilege CRUD |
| 6 | `/api/user-privileges` | GET | SSO | User's active privileges |
| 7 | `/api/user/privileges` | GET,POST | No* | Check privileges by member_id param |
| 8 | `/api/coins` | GET | SSO | Coin balance + history |

---

## 10. BerkomunitasPlus & DRW Integration

### BerkomunitasPlus

| # | Endpoint | Methods | Auth | Deskripsi |
|---|----------|---------|------|-----------|
| 1 | `/api/berkomunitasplus` | POST,DELETE,GET | Admin/SSO | Grant/revoke/check Plus privilege |
| 2 | `/api/plus/verified-data` | GET,POST | SSO+Plus | Get/save verified BC data |

### Beauty Consultant / DRW Skincare (7 routes)

| # | Endpoint | Methods | Auth | Deskripsi |
|---|----------|---------|------|-----------|
| 3 | `/api/beauty-consultant/test` | GET,POST,PUT | No | Test DRW API connection |
| 4 | `/api/beauty-consultant/verified` | GET,PUT | SSO | Get/update verified BC data |
| 5 | `/api/beauty-consultant/sync` | POST | SSO | Sync from DRW API |
| 6 | `/api/beauty-consultant/preview` | POST | No | Preview BC data |
| 7 | `/api/beauty-consultant/connect` | POST,GET | SSO | Connect member to BC |
| 8 | `/api/beauty-consultant/confirm` | POST | SSO | Confirm BC connection |
| 9 | `/api/beauty-consultant/disconnect` | POST | SSO | Disconnect BC account |
| 10 | `/api/beauty-consultant/debug` | POST | SSO | Debug BC data |

### DRW Corp (5 routes)

| # | Endpoint | Methods | Auth | Deskripsi |
|---|----------|---------|------|-----------|
| 11 | `/api/drwcorp/employees` | GET | No | List employees + filters |
| 12 | `/api/drwcorp/employees/[id]` | GET,PUT | No | Employee detail + tasks |
| 13 | `/api/drwcorp/search-members` | GET | No | Search members |
| 14 | `/api/drwcorp/task-completion` | GET | No | Task completion data |
| 15 | `/api/custom-dashboard/drwcorp` | GET | No | DRW Corp dashboard |

**⚠️ Semua DRW Corp endpoint TANPA auth — siapapun bisa akses data karyawan.**

---

## 11. Utility & System

| # | Endpoint | Methods | Auth | Deskripsi |
|---|----------|---------|------|-----------|
| 1 | `/api/wilayah` | GET | No | Proxy Indonesian region API |
| 2 | `/api/regions` | GET | No | Provinces/cities/districts |
| 3 | `/api/generate-avatar` | POST | No | Generate DiceBear avatar |
| 4 | `/api/landing-stats` | GET | No | Landing page stats (cached 1hr) |
| 5 | `/api/create-member` | POST | SSO | Create new member record |
| 6 | `/api/system/validation` | GET | No | Full system validation (DRW API, DB) |

---

## 12. Webhooks & Debug

| # | Endpoint | Methods | Auth | Deskripsi |
|---|----------|---------|------|-----------|
| 1 | `/api/webhooks/clerk` | POST | Svix | **LEGACY** Clerk webhook handler |
| 2 | `/api/debug-events` | handler | No | Debug events |
| 3 | `/api/debug-db` | GET | SSO | Debug DB data |
| 4 | `/api/debug-privileges` | GET | No | Debug privileges |
| 5 | `/api/debug/leaderboard-photos` | GET | No | Debug photos |
| 6 | `/api/debug/loyalty` | GET | SSO | Debug loyalty data |
| 7 | `/api/debug/profile-data` | GET | SSO | Debug profile data |
| 8 | `/api/debug/admin` | GET | SSO | Debug admin access |
| 9 | `/api/test/member-badges-debug` | GET | x-user-email | Test member badges |

**⚠️ Semua debug endpoint HARUS DIHAPUS di production.**

---

## 13. Backend Libraries Detail

### 13.1 `lib/prisma.js` — Prisma Singleton

```javascript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });

export default prisma;
```

**Connection:** `connection_limit=2` (prod), `connection_limit=10` (dev)

### 13.2 `lib/prisma-retry.js` — Retry Wrapper

```javascript
/**
 * @param {Function} operation - Async function yang akan di-retry
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} baseDelay - Base delay in ms (default: 500)
 * @returns {Promise<any>} - Result dari operation
 * @throws {Error} - Error terakhir jika semua retry gagal
 */
export async function withRetry(operation, maxRetries = 3, baseDelay = 500)
```

Retries on: `ECONNRESET`, `ETIMEDOUT`, `ECONNREFUSED`, `P1001` (Prisma connection error). Exponential backoff: 500ms → 1000ms → 2000ms.

### 13.3 `lib/prisma-with-sync-middleware.js` — Sync Middleware

⚠️ **CREATES SEPARATE Prisma Client** (doubles connection pool!)

```javascript
const prismaWithSync = new PrismaClient({...});

prismaWithSync.$use(async (params, next) => {
  const result = await next(params);
  
  // If members.update changed loyalty_point, auto-sync coin
  if (params.model === 'members' && params.action === 'update') {
    const data = params.args.data;
    if (data.loyalty_point !== undefined) {
      // Sync coin = loyalty_point (if coin < loyalty)
      await prismaWithSync.members.update({
        where: { id: params.args.where.id },
        data: { coin: { set: result.loyalty_point }, _skipMiddleware: true }
      });
    }
  }
  return result;
});
```

**⚠️ Issues:**
1. Doubles connection pool (2 Prisma clients)
2. Potential infinite recursion (update triggers middleware again)
3. `_skipMiddleware` flag is non-standard

### 13.4 `lib/sso.js` — Client-side SSO (216 lines)

```javascript
// Functions:
export async function loginWithGoogle(googleToken, platform = 'Berkomunitas')
// → POST /api/sso/google-login → stores tokens in localStorage

export async function verifyToken(token)
// → POST /api/sso/verify-token → returns user object or null

export async function refreshAccessToken(refreshToken)
// → POST /api/sso/refresh-token → stores new accessToken

export async function trackActivity(activityType, platform, metadata)
// → POST /api/sso/track-activity

export async function getCurrentUser()
// → Reads localStorage 'access_token' → verifyToken() → refreshAccessToken() if expired

export async function logout()
// → Clears localStorage + cookies, optionally revokes session

export function getVerifiedUser()
// → Returns cached user from localStorage (sync, no API call)

// Constants:
export const ACTIVITY_POINTS = {
  login: 1, purchase: 10, review: 5, referral: 20,
  post_comment: 3, share: 2, course_complete: 15,
  appointment_book: 5, task_complete: 10, daily_check_in: 2, profile_complete: 5
};
```

### 13.5 `lib/ssoAuth.js` — Server-side Auth (102 lines)

```javascript
import jwt from 'jsonwebtoken';

/**
 * Get current user from request (server-side)
 * @param {Request} request - HTTP request object
 * @returns {Promise<{id: number, email: string, name: string}|null>}
 */
export async function getCurrentUser(request)
// Reads cookie 'sso_token' OR header 'Authorization: Bearer <token>'
// Verifies with jwt.verify(token, JWT_SECRET)
// Returns { memberId, email, name } or null

/**
 * Require authenticated user (throws otherwise)
 * @param {Request} request
 * @returns {Promise<{id: number, email: string, name: string}>}
 * @throws {Error} 'Not authenticated'
 */
export async function requireAuth(request)

/**
 * Higher-order function to wrap API handler with auth
 * @param {Function} handler - (request, user) => Response
 * @returns {Function} - (request) => Response
 */
export function withSSOAuth(handler)
```

**⚠️ SECURITY ISSUE:** Line yang console.log JWT_SECRET harus dihapus.

### 13.6 `lib/storage.js` — Unified Storage (433 lines)

```javascript
/**
 * Create MinIO S3 Client
 * @returns {S3Client}
 * @throws {Error} if MINIO_ENDPOINT not set
 */
export function createMinIOClient()

/**
 * Upload file to MinIO
 * @param {File} file - File object
 * @param {string} folder - default: 'profile-pictures'
 * @param {string} prefix - default: 'upload'
 * @returns {Promise<string>} - Public URL
 * Validates: image types only, max 5MB
 */
export async function uploadToMinIO(file, folder, prefix)

/**
 * Delete file from MinIO
 * @param {string} fileUrl - Full URL of file to delete
 * @returns {Promise<boolean>}
 */
export async function deleteFromMinIO(fileUrl)

/**
 * Upload file to VPS
 * @param {File} file
 * @param {string} folder
 * @param {string} prefix
 * @returns {Promise<string>} - Public URL
 */
export async function uploadToVPS(file, folder, prefix)

/**
 * Upload file to Cloudinary (legacy)
 * @param {File} file
 * @param {string} folder
 * @returns {Promise<string>} - Cloudinary URL
 */
export async function uploadToCloudinary(file, folder)

/**
 * Unified upload with cascade fallback
 * Priority: MinIO → VPS → Cloudinary → Local (dev only)
 * @param {File} file
 * @param {object} options - { folder, prefix }
 * @returns {Promise<{url: string, storage: string}>}
 */
export async function uploadFile(file, options)

/**
 * Get storage config/status
 * @returns {object} - { minio: bool, vps: bool, cloudinary: bool, local: bool }
 */
export function getStorageConfig()
```

### 13.7 `lib/coinLoyaltyManager.js` — Point Manager (211 lines)

```javascript
class CoinLoyaltyManager {
  /**
   * Add loyalty points + auto-sync coin
   * @param {number} memberId
   * @param {number} points - Amount to add
   * @param {string} event - Description
   * @param {string} eventType - 'task'/'login'/'admin'/'manual'
   * @param {object} extra - { taskId, commentId }
   * @returns {Promise<{member, coinHistory, loyaltyHistory}>}
   * Uses Prisma transaction for atomicity
   */
  async addLoyaltyPoints(memberId, points, event, eventType, extra = {})

  /**
   * Redeem (spend) coins
   * @param {number} memberId
   * @param {number} amount - Coins to spend
   * @param {string} event - Description
   * @returns {Promise<{member, coinHistory}>}
   * @throws {Error} 'Insufficient coins'
   * @throws {Error} 'Member not found'
   */
  async redeemCoins(memberId, amount, event)

  /**
   * Sync coin to match loyalty (fix discrepancies)
   * @param {number} memberId
   * @returns {Promise<member>}
   */
  async syncMemberCoinsWithLoyalty(memberId)

  /**
   * Sync ALL members' coins
   * @returns {Promise<{synced: number, total: number}>}
   */
  async syncAllMembers()

  /**
   * Get member's point summary
   * @param {number} memberId
   * @returns {Promise<{member, level, nextLevel, coinHistory, loyaltyHistory}>}
   */
  async getMemberPointsSummary(memberId)
}

// Quick helpers (create instance internally):
export async function addPoints(memberId, points, event, type, extra)
export async function spendCoins(memberId, amount, event)
export async function fixSync(memberId)
```

### 13.8 `lib/rankingLevels.js` — Ranking System (293 lines)

```javascript
// 19 levels array (exported)
export const RANKING_LEVELS = [
  { level: 1, name: 'Neraka Jahannam', min_points: 0, /* ...colors, icon, description */ },
  // ... through level 19
  { level: 19, name: 'Surga Firdaus', min_points: 10000, /* ... */ },
];

/**
 * Find user's current level based on points
 * @param {number} loyaltyPoints
 * @returns {{ level, name, min_points, color, icon, description }}
 */
export function findUserLevel(loyaltyPoints)

/**
 * Get next level info
 * @param {number} loyaltyPoints
 * @returns {{ nextLevel, pointsNeeded, progress } | null} - null if max level
 */
export function getNextLevel(loyaltyPoints)

/**
 * Calculate loyalty needed to reach specific level
 * @param {number} targetLevel - 1-19
 * @param {number} currentPoints
 * @returns {number} - Points still needed
 */
export function calculateLoyaltyNeeded(targetLevel, currentPoints)
```

### 13.9 `lib/taskNotifications.js` — Task Notification Factories (117 lines)

```javascript
// All functions: (memberId, taskData) => Promise<void>
// All silently swallow errors (try/catch with empty catch)

export async function notifyTaskAccepted(memberId, { taskKeyword, taskId })
// "Kamu telah mengambil tugas: {keyword}"

export async function notifyTaskCompleted(memberId, { taskKeyword, pointsEarned })
// "Tugas '{keyword}' berhasil! +{points} poin"

export async function notifyTaskFailed(memberId, { taskKeyword, reason })
// "Tugas '{keyword}' gagal: {reason}"

export async function notifyTaskExpired(memberId, { taskKeyword })
// "Tugas '{keyword}' sudah expired"

export async function notifyScreenshotUploaded(memberId, { taskKeyword })
// "Screenshot untuk '{keyword}' berhasil diupload"

export async function notifyScreenshotVerified(memberId, { taskKeyword, status, pointsEarned })
// "Screenshot '{keyword}' telah diverifikasi: {status}"
```

### 13.10 `lib/rewardNotifications.js` — Reward Notification Factories (107 lines)

```javascript
export async function notifyRewardRedeemed(memberId, { rewardName, pointsSpent })
// "Kamu telah menukar {rewardName} seharga {pointsSpent} coin"

export async function notifyRedemptionStatusChanged(memberId, { rewardName, newStatus })
// "Status penukaran {rewardName}: {newStatus}"

export async function notifyRewardShipped(memberId, { rewardName, shippingMethod })
// "Hadiah {rewardName} telah dikirim via {shippingMethod}"

export async function notifyRewardDelivered(memberId, { rewardName })
// "Hadiah {rewardName} telah sampai! Konfirmasi penerimaan ya"
```

### 13.11 `lib/adminAuth.js` & `lib/requireAdmin.js` — Admin Utilities

```javascript
// lib/adminAuth.js
export async function checkAdminStatus(request)
// Returns { isAdmin: boolean, user: object }

// lib/requireAdmin.js
export async function requireAdmin(request)
// Returns { user } or { error, status }
// Checks user_privileges table for 'admin' + is_active + not expired
```

### 13.12 `lib/bigIntUtils.js` — BigInt Conversion

```javascript
/**
 * Convert BigInt values to Number in any object/array
 * @param {any} data - Object/array/value potentially containing BigInt
 * @returns {any} - Same structure with BigInt→Number
 */
export function convertBigInt(data)
```

### 13.13 `lib/apiClient.js` — Client Fetch Wrapper

```javascript
export async function fetchAPI(endpoint, options = {})
// Adds auth headers, handles errors

export async function createTaskSubmission(taskId)
// ⚠️ References undeclared `memberId` variable — BUG
```

### 13.14 `lib/drwcorp-employees.js` — Hardcoded Employee List

```javascript
export const DRWCORP_EMPLOYEES = [
  { nama_lengkap: "...", email: "...", divisi: "..." },
  // 53 entries
];
```

Static in-memory array. Used to seed `drwcorp_employees` table.

---

## 14. API Coding Patterns & Templates

### Template: API Route with SSO Auth

```javascript
// src/app/api/example/route.js
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await prisma.someTable.findMany({
      where: { member_id: user.id },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Template: API Route with Admin Auth

```javascript
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check
    const privilege = await prisma.user_privileges.findFirst({
      where: {
        member_id: user.id,
        privilege: 'admin',
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      }
    });

    if (!privilege) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // ... admin logic here

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Template: API Route with File Upload

```javascript
import { uploadFile } from '@/lib/storage';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

    const { url, storage } = await uploadFile(file, {
      folder: 'uploads',
      prefix: 'custom'
    });

    // Save URL to database
    await prisma.members.update({
      where: { id: user.id },
      data: { foto_profil_url: url }
    });

    return Response.json({ success: true, url, storage });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### Template: Dynamic Route Parameter

```javascript
// src/app/api/example/[id]/route.js
export async function GET(request, { params }) {
  const { id } = await params;  // Next.js 15: params is a Promise
  
  const item = await prisma.someTable.findUnique({
    where: { id: parseInt(id) }
  });

  if (!item) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json(item);
}
```

---

> **Dokumen selanjutnya:** [DOCS_4_FRONTEND_N8N_DEPLOY.md](DOCS_4_FRONTEND_N8N_DEPLOY.md) — Frontend pages, components, hooks, n8n integration, deployment guide
