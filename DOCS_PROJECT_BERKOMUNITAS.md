# 📚 Dokumentasi Lengkap — Berkomunitas Platform

> **Versi:** 2.0 | **Last Updated:** 6 Maret 2026  
> **Repository:** `MKWcorp/berkomunitas` | **Branch:** `development` (default: `main`)  
> **Domain:** `berkomunitas.com` | **Admin:** `admin.berkomunitas.com` | **Rewards:** `rewards.berkomunitas.com`

---

## Daftar Isi

1. [Overview Project](#1-overview-project)
2. [Tech Stack](#2-tech-stack)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Struktur Folder](#4-struktur-folder)
5. [Database Schema (PostgreSQL + Prisma)](#5-database-schema-postgresql--prisma)
6. [Sistem Autentikasi (SSO)](#6-sistem-autentikasi-sso)
7. [API Endpoints (Lengkap)](#7-api-endpoints-lengkap)
8. [Frontend Pages & Components](#8-frontend-pages--components)
9. [Admin Panel](#9-admin-panel)
10. [Rewards App](#10-rewards-app)
11. [Sistem Tugas (Task System)](#11-sistem-tugas-task-system)
12. [Sistem Poin & Coin (Dual Currency)](#12-sistem-poin--coin-dual-currency)
13. [Integrasi n8n (Workflow Automation)](#13-integrasi-n8n-workflow-automation)
14. [Integrasi Pihak Ketiga](#14-integrasi-pihak-ketiga)
15. [Library & Utilities](#15-library--utilities)
16. [Hooks (React Client-Side)](#16-hooks-react-client-side)
17. [Environment Variables](#17-environment-variables)
18. [Deployment (Vercel)](#18-deployment-vercel)
19. [Known Issues & Technical Debt](#19-known-issues--technical-debt)
20. [Panduan untuk AI Agent](#20-panduan-untuk-ai-agent)

---

## 1. Overview Project

**Berkomunitas** adalah platform komunitas digital untuk ekosistem **DRW Corp** (DRW Skincare, Dzawani, dll). Platform ini menghubungkan anggota komunitas (Beauty Consultant/reseller) dengan tugas-tugas sosial media untuk mendapatkan poin loyalitas dan reward.

### Core Flow Pengguna:
```
Register (Google OAuth) → Lengkapi Profil → Kerjakan Tugas → Dapat Poin & Coin → Redeem Reward
```

### Fitur Utama:
| Fitur | Deskripsi |
|-------|-----------|
| **Task System** | Member comment di social media (IG/FB/TikTok) untuk dapat poin |
| **Dual Currency** | Loyalty Point (naik terus) + Coin (bisa dibelanjakan) |
| **Reward System** | Katalog reward yang bisa ditukar dengan coin |
| **Leaderboard** | Peringkat member berdasarkan loyalitas & komentar |
| **Badge System** | Lencana pencapaian (Silver/Gold/Platinum) |
| **Ranking System** | 19 level ranking berdasarkan konsep Islami |
| **BC Connection** | Verifikasi Beauty Consultant DRW Skincare |
| **DRW Corp Dashboard** | Tracking task completion per divisi karyawan |
| **Event Boost** | Multiplier poin untuk event spesial (2x, 3x, 5x) |
| **Admin Panel** | Full CRUD + statistik untuk admin |
| **Rewards App** | Sub-app terpisah untuk manajemen reward & fulfillment |

---

## 2. Tech Stack

### Frontend
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| **Next.js** | 15.x | App Router (React Server Components) |
| **React** | 18.x | UI Library |
| **Tailwind CSS** | 3.x | Styling + Glass Morphism Theme |
| **Recharts** | 3.x | Chart/grafik di dashboard |
| **Tremor** | 3.x | Admin UI components |
| **FontAwesome** | 7.x | Ikon |
| **Heroicons** | 2.x | Ikon tambahan |
| **react-confetti** | 6.x | Animasi confetti saat task selesai |
| **react-tooltip** | 5.x | Tooltip |

### Backend
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| **Next.js API Routes** | 15.x | REST API (App Router) |
| **Prisma ORM** | 5.22 | Database ORM + Migration |
| **PostgreSQL** | — | Database utama (hosted) |
| **JSON Web Token** | 9.x | Autentikasi (access + refresh token) |
| **jose** | 6.x | JWT verification (Edge-compatible, untuk middleware) |
| **Google Auth Library** | 9.x | Google OAuth token verification |
| **@react-oauth/google** | 0.12 | Google login button (frontend) |

### Infrastructure
| Teknologi | Keterangan |
|-----------|------------|
| **Vercel** | Hosting & deployment (auto-deploy dari GitHub) |
| **MinIO** | Object storage (S3-compatible) — Primary |
| **Cloudinary** | Image CDN — Legacy fallback |
| **n8n** | Workflow automation (task verification, comment scraping) |
| **GitHub** | Source code, CI/CD via Vercel |

### Subdomain Architecture
```
berkomunitas.com           → Main app (user-facing)
admin.berkomunitas.com     → Admin panel (/admin-app/)
rewards.berkomunitas.com   → Rewards management (/rewards-app/)
```
Routing subdomain dikonfigurasi di `vercel.json` menggunakan `rewrites`.

---

## 3. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BERKOMUNITAS PLATFORM                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────┐              │
│  │  Main    │   │  Admin Panel │   │  Rewards App   │              │
│  │  App     │   │  (admin.*)   │   │  (rewards.*)   │              │
│  │  (*.com) │   │              │   │                │              │
│  └────┬─────┘   └──────┬───────┘   └───────┬────────┘              │
│       │                │                    │                       │
│       └────────────────┼────────────────────┘                       │
│                        │                                            │
│              ┌─────────▼─────────┐                                  │
│              │  Next.js API      │                                  │
│              │  Routes (/api/)   │                                  │
│              └─────────┬─────────┘                                  │
│                        │                                            │
│  ┌─────────────────────┼─────────────────────┐                      │
│  │                     │                     │                      │
│  ▼                     ▼                     ▼                      │
│ ┌──────────┐   ┌──────────────┐   ┌────────────────┐               │
│ │ Prisma   │   │  MinIO/S3    │   │  Google OAuth   │              │
│ │ (PgSQL)  │   │  (Storage)   │   │  (Auth)         │              │
│ └──────────┘   └──────────────┘   └────────────────┘               │
│                                                                     │
│  ┌─────────────────────────────────────────┐                        │
│  │  n8n Workflows (External)               │                        │
│  │  - Instagram comment scraping           │                        │
│  │  - Facebook comment scraping            │                        │
│  │  - Task verification (auto)             │                        │
│  │  - Screenshot verification              │                        │
│  │  - TikTok content scraping              │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Struktur Folder

```
berkomunitas/
├── prisma/                          # Database
│   ├── schema.prisma                # Schema utama (838 baris, 40+ model)
│   ├── migrations/                  # Migration files
│   ├── add-coin-system.sql          # Manual SQL migration
│   ├── migration-production.sql     # Production migration
│   └── missing-columns-migration.sql
│
├── lib/                             # Server-side utilities (root level)
│   ├── prisma.js                    # Singleton PrismaClient
│   ├── prisma-retry.js              # Retry with exponential backoff
│   ├── prisma-with-sync-middleware.js  # Coin/loyalty auto-sync middleware
│   ├── sso.js                       # Client-side SSO helpers
│   ├── ssoAuth.js                   # Server-side JWT auth (getCurrentUser)
│   ├── adminAuth.js                 # Admin privilege checker
│   ├── requireAdmin.js              # Admin middleware
│   ├── storage.js                   # MinIO/Cloudinary unified storage
│   ├── coinLoyaltyManager.js        # CoinLoyaltyManager class
│   ├── taskNotifications.js         # Task notification factory
│   ├── rewardNotifications.js       # Reward notification factory
│   ├── apiClient.js                 # Client-side API wrapper
│   ├── rankingLevels.js             # 19-level Islamic ranking system
│   ├── bigIntUtils.js               # BigInt → Number conversion
│   └── drwcorp-employees.js         # Static employee roster
│
├── src/
│   ├── middleware.js                # SSO route protection (Edge Runtime)
│   ├── app/
│   │   ├── layout.js                # Root layout (Glass Theme, Auth, Nav)
│   │   ├── page.js                  # Landing page / Homepage
│   │   ├── globals.css              # Tailwind + global styles
│   │   │
│   │   ├── api/                     # === API ROUTES ===
│   │   │   ├── sso/                 # Auth (google-login, verify, refresh, sessions)
│   │   │   ├── tugas/               # Task listing & submission
│   │   │   ├── tugas-ai-2/          # Screenshot tasks
│   │   │   ├── task-submissions/    # Submission management
│   │   │   ├── coins/               # Coin balance & history
│   │   │   ├── rewards/             # Reward redemption
│   │   │   ├── members/             # Member listing
│   │   │   ├── leaderboard/         # Ranking (top 50 + infinite scroll)
│   │   │   ├── events/              # Event boost management
│   │   │   ├── notifikasi/          # Notification CRUD
│   │   │   ├── profil/              # Profile management
│   │   │   ├── drwcorp/             # DRW Corp employee tracker
│   │   │   ├── webhooks/            # Legacy Clerk webhook
│   │   │   ├── admin/               # Admin-only endpoints
│   │   │   │   ├── dashboard/       # Dashboard stats
│   │   │   │   ├── tugas/           # Task CRUD
│   │   │   │   ├── tugas-ai-2/      # Screenshot task CRUD
│   │   │   │   ├── task-submissions/ # Submission verify/reject
│   │   │   │   ├── members/         # Member CRUD
│   │   │   │   ├── coins/           # Coin management
│   │   │   │   ├── points/          # Point management
│   │   │   │   ├── rewards/         # Reward CRUD + image upload
│   │   │   │   ├── redemptions/     # Redemption status management
│   │   │   │   ├── badges/          # Badge CRUD
│   │   │   │   ├── privileges/      # Privilege management
│   │   │   │   ├── social-media/    # Social media management
│   │   │   │   ├── levels/          # Level CRUD
│   │   │   │   └── events/          # Event CRUD
│   │   │   └── ...                  # Other routes
│   │   │
│   │   ├── tugas/                   # Task page (list + detail)
│   │   ├── profil/                  # Profile page (edit + public view)
│   │   ├── leaderboard/             # Leaderboard page
│   │   ├── rewards/                 # Reward catalog page
│   │   ├── coins/                   # Coin history page
│   │   ├── loyalty/                 # Loyalty history page
│   │   ├── notifikasi/              # Notification page
│   │   ├── security/                # Account security page
│   │   ├── plus/                    # BC Connection page
│   │   ├── drwcorp/                 # DRW Corp dashboard
│   │   ├── login/                   # Login page
│   │   ├── faq/                     # FAQ page
│   │   ├── landing/                 # Alternate landing page
│   │   │
│   │   ├── admin-app/               # === ADMIN PANEL ===
│   │   │   ├── layout.js            # Admin layout
│   │   │   ├── page.js              # Admin entry (auth check)
│   │   │   ├── components/          # Admin shared components
│   │   │   ├── dashboard/           # Admin dashboard
│   │   │   ├── members/             # Member management
│   │   │   ├── tasks/               # Task management
│   │   │   ├── add-task/            # Add new task
│   │   │   ├── edit-task/           # Edit task
│   │   │   ├── events/              # Event boost management
│   │   │   ├── coins/               # Coin management
│   │   │   ├── loyalty/             # Loyalty management
│   │   │   ├── points/              # Points management
│   │   │   ├── badges/              # Badge management
│   │   │   ├── privileges/          # Privilege management
│   │   │   ├── social-media/        # Social media management
│   │   │   ├── statistics/          # Statistics dashboard
│   │   │   └── ...                  # Others
│   │   │
│   │   └── rewards-app/             # === REWARDS APP ===
│   │       ├── dashboard/           # Rewards dashboard
│   │       ├── rewards/             # Rewards CRUD
│   │       └── status/              # Redemption status management
│   │
│   ├── components/                  # Shared React components
│   │   ├── GlassLayout.js           # Glass morphism theme
│   │   ├── AdminComponents.js       # Reusable admin UI
│   │   ├── EventBoostComponents.js  # Event boost banners
│   │   ├── GoogleLoginButton.js     # Google login
│   │   ├── ShippingForm.js          # Shipping address form
│   │   ├── ShippingTracker.js       # Shipping tracking
│   │   ├── ranking/                 # Ranking visualization
│   │   └── tugas/                   # Task-specific components
│   │
│   ├── hooks/                       # React hooks
│   │   ├── useSSOUser.js            # Auth state (replaces Clerk's useUser)
│   │   ├── useAdminStatus.js        # Admin privilege check
│   │   ├── useProfileCompletion.js  # Profile completeness check
│   │   ├── useEventBoost.js         # Event boost state
│   │   └── ...
│   │
│   └── utils/                       # Shared utilities
│       ├── privilegeChecker.js      # 4-tier privilege system
│       ├── hierarchicalPrivilegeChecker.js  # (Duplicate — deprecated)
│       ├── generateUsername.js       # Username auto-generation
│       └── prisma.js                # Alternative Prisma import
│
├── scripts/                         # Utility & migration scripts
│   ├── migrate-*.js/.py             # Database migration scripts
│   ├── fix-*.js/.py                 # Bug fix scripts
│   ├── test-*.js                    # Test scripts
│   ├── check-*.js/.py              # Diagnostic scripts
│   └── monitor-db-health.js         # DB health monitoring
│
├── middleware.js                    # Root middleware (legacy Clerk)
├── next.config.mjs                  # Next.js config
├── vercel.json                      # Vercel deployment config
├── tailwind.config.js               # Tailwind config
├── package.json                     # Dependencies
└── .env.local                       # Environment variables (not in git)
```

---

## 5. Database Schema (PostgreSQL + Prisma)

### Entity Relationship Diagram

```
┌──────────────┐       ┌───────────────────┐       ┌──────────────────┐
│   members    │──1:N──│  task_submissions  │──N:1──│    tugas_ai      │
│              │       │                   │       │                  │
│  id (PK)     │       │  id_member (FK)    │       │  id (PK)         │
│  nama_lengkap│       │  id_task (FK)      │       │  keyword_tugas   │
│  email       │       │  status_submission │       │  link_postingan  │
│  google_id   │       │  tanggal_submission│       │  point_value     │
│  loyalty_point│      │                   │       │  media_id (FK)   │
│  coin        │       └───────────────────┘       └────────┬─────────┘
│  foto_profil │                                            │
│  clerk_id    │       ┌───────────────────┐       ┌────────▼─────────┐
│  sso_metadata│──1:N──│  coin_history     │       │     media        │
│              │       │                   │       │  (Instagram)     │
│              │──1:N──│loyalty_point_histy │       └──────────────────┘
│              │       │                   │
│              │──1:N──│  notifications    │       ┌──────────────────┐
│              │       │                   │       │   tugas_ai_2     │
│              │──1:N──│  member_badges    │──N:1──│                  │
│              │       │                   │       │  id (PK)         │
│              │──1:N──│profil_sosial_media│       │  verification_   │
│              │       │                   │       │  rules (JSON)    │
│              │──1:N──│  reward_redemp.   │       └───────┬──────────┘
│              │       │                   │               │
│              │──1:N──│  PlatformSession  │       ┌───────▼──────────┐
│              │       │  (SSO sessions)   │       │tugas_ai_2_      │
│              │       │                   │       │screenshots       │
│              │──1:N──│  user_privileges  │       │                  │
│              │       │                   │       │ n8n_webhook_id   │
│              │──1:1──│  user_usernames   │       │ n8n_execution_id │
│              │       │                   │       │ ai_extracted_text│
│              │──1:1──│bc_drwskincare_plus│       │ ai_confidence    │
│              │       │                   │       └──────────────────┘
│              │──1:N──│  UserActivity     │
│              │       │                   │
│              │──1:N──│drwcorp_employees  │
└──────────────┘       └───────────────────┘
```

### Model Database Lengkap (40+ tabel)

#### Core User
| Tabel | Deskripsi | Relasi Utama |
|-------|-----------|-------------|
| `members` | Tabel utama user/member | Central — hampir semua tabel FK ke sini |
| `user_usernames` | Username unik per member | 1:1 ke `members` |
| `member_emails` | Email member (multi-email) | N:1 ke `members` |
| `profil_sosial_media` | Akun sosmed member | N:1 ke `members` |
| `user_privileges` | Role/privilege member | N:1 ke `members` |
| `PlatformSession` | Session login aktif | N:1 ke `members` |
| `UserActivity` | Log aktivitas user | N:1 ke `members` |

#### Task System
| Tabel | Deskripsi | Relasi Utama |
|-------|-----------|-------------|
| `tugas_ai` | Task auto-verify (comment matching) | 1:N ke `task_submissions`, 1:1 ke `media` |
| `tugas_ai_2` | Task screenshot-based | 1:N ke `tugas_ai_2_screenshots` |
| `task_submissions` | Tracking pengerjaan task oleh member | N:1 ke `tugas_ai`, N:1 ke `members` |
| `tugas_ai_2_screenshots` | Upload screenshot + hasil AI verify | N:1 ke `tugas_ai_2`, N:1 ke `members` |
| `facebook_tugas_ai` | Task khusus Facebook | Standalone |
| `facebook_task_submissions` | Submission task Facebook | Standalone |
| `member_task_stats` | Cache statistik task per member | 1:1 ke `members` |

#### Social Media Data
| Tabel | Deskripsi | Relasi Utama |
|-------|-----------|-------------|
| `media` | Data media Instagram (scraped) | 1:1 ke `tugas_ai` |
| `comments` | Komentar Instagram/TikTok (scraped) | Standalone |
| `facebook_pages` | Halaman Facebook (managed) | 1:N ke `facebook_posts` |
| `facebook_posts` | Post Facebook | 1:N ke `facebook_comments` |
| `facebook_comments` | Komentar Facebook | N:1 ke `facebook_posts` |
| `facebook_execution_log` | Log eksekusi scraping | Standalone |
| `facebook_trigger_comment_queue` | Queue untuk auto-comment | Standalone |
| `instagram_accounts` | Akun Instagram (managed) | Standalone |
| `tiktok_contents` | Konten TikTok (scraped) | Standalone |

#### Points & Coins
| Tabel | Deskripsi |
|-------|-----------|
| `coin_history` | Riwayat perubahan coin |
| `loyalty_point_history` | Riwayat perubahan loyalty point |
| `loyalty_point_rules` | Aturan poin per event type |
| `member_transactions` | Transaksi terpadu (coin + loyalty) |
| `transaction_types` | Tipe transaksi (kode + metadata) |

#### Rewards & Badges
| Tabel | Deskripsi |
|-------|-----------|
| `rewards` | Katalog reward |
| `reward_categories` | Kategori reward |
| `reward_redemptions` | Riwayat penukaran reward |
| `badges` | Definisi badge |
| `member_badges` | Badge yang dimiliki member |
| `levels` | Definisi level (required_points) |

#### Rankings & Statistics
| Tabel | Deskripsi |
|-------|-----------|
| `peringkat_member_loyalty` | Leaderboard loyalty (pre-computed) |
| `peringkat_member_comments` | Leaderboard komentar (pre-computed) |
| `peringkat_sumber_tugas` | Ranking sumber tugas |
| `peringkat_tugas_populer` | Ranking tugas populer |
| `statistik_global` | Statistik global |
| `statistik_harian` | Statistik harian |

#### DRW Ecosystem
| Tabel | Deskripsi |
|-------|-----------|
| `bc_drwskincare_api` | Data reseller dari API DRW Skincare |
| `bc_drwskincare_plus` | Koneksi member ↔ reseller |
| `bc_drwskincare_plus_verified` | Data reseller terverifikasi |
| `drwcorp_employees` | Karyawan DRW Corp |

#### System
| Tabel | Deskripsi |
|-------|-----------|
| `event_settings` | Konfigurasi event boost |
| `notifications` | Notifikasi member |
| `partners` | Data partner platform |
| `system_logs` | Log sistem |
| `RegisteredPlatform` | Platform yang terdaftar (SSO) |

### Status Values yang Digunakan

**Task Submission (`status_submission`):**
```
tersedia → sedang_verifikasi → selesai
                              → gagal_diverifikasi
```

**Reward Redemption (`status`):**
```
menunggu_verifikasi → diproses → dikirim → diterima
                                        → ditolak (refund coin + stock)
```

**Screenshot Verification (`status`):**
```
sedang_verifikasi → selesai
                  → gagal
```

**Employee Matching (`matching_status`):**
```
unmatched → ambiguous → matched
```

---

## 6. Sistem Autentikasi (SSO)

### Migrasi dari Clerk ke Custom SSO
Project ini awalnya menggunakan **Clerk** untuk auth, kemudian dimigrasi ke **custom SSO** dengan Google OAuth + JWT. Beberapa referensi Clerk masih ada di codebase (legacy).

### Alur Autentikasi

```
┌──────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                             │
│                                                           │
│  1. User klik "Login with Google"                         │
│     └── @react-oauth/google (Frontend)                    │
│                                                           │
│  2. Google returns ID Token                               │
│     └── POST /api/sso/google-login                        │
│         ├── Verify Google token (google-auth-library)      │
│         ├── Find/create member by email/google_id          │
│         ├── Generate JWT access token (7 hari)             │
│         ├── Generate JWT refresh token                     │
│         ├── Create PlatformSession record                  │
│         └── Return: { accessToken, refreshToken, user }    │
│                                                           │
│  3. Frontend stores tokens                                │
│     ├── localStorage: access_token, refresh_token, user    │
│     └── Cookie: access_token (httponly)                    │
│                                                           │
│  4. Subsequent API calls                                   │
│     ├── Authorization: Bearer <access_token>               │
│     └── OR Cookie: access_token=<token>                    │
│                                                           │
│  5. Token expired → POST /api/sso/refresh-token            │
│     └── Returns new access token                           │
└──────────────────────────────────────────────────────────┘
```

### File-file Auth Utama

| File | Sisi | Fungsi |
|------|------|--------|
| `lib/sso.js` | Client | `loginWithGoogle()`, `verifyToken()`, `refreshToken()`, `getCurrentUser()`, `logout()` |
| `lib/ssoAuth.js` | Server | `getCurrentUser(request)` — extract JWT dari header/cookie, verify, return member data |
| `src/middleware.js` | Edge | Route protection — verify JWT via `jose`, redirect unauth ke `/login` |
| `src/hooks/useSSOUser.js` | Client | React hook `useSSOUser()` — returns `{ user, isLoaded, isSignedIn }` |

### Privilege Hierarchy (4 Tier)
```
user (level 1) → berkomunitasplus (level 2) → partner (level 3) → admin (level 4)
```
- **user**: Default, semua member
- **berkomunitasplus**: BC DRW Skincare yang sudah terverifikasi
- **partner**: Partner brand / pengelola
- **admin**: Full access ke admin panel

File: `src/utils/privilegeChecker.js`

---

## 7. API Endpoints (Lengkap)

### 7.1 SSO (Authentication)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/sso/google-login` | No | Login dengan Google token, return JWT |
| POST | `/api/sso/verify-token` | Yes | Verify JWT, return user data |
| POST | `/api/sso/refresh-token` | No | Refresh expired token |
| GET | `/api/sso/get-user` | Yes | Get full user profile |
| GET | `/api/sso/sessions` | Yes | List active sessions |
| POST | `/api/sso/revoke-session` | Yes | Logout dari device tertentu |
| POST | `/api/sso/track-activity` | Yes | Track activity + award points |

### 7.2 Tasks (Tugas)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/tugas` | Yes | List tugas dengan pagination, filter, search |
| GET | `/api/tugas/[id]` | Yes | Detail tugas + member yang sudah selesai |
| POST | `/api/tugas/[id]/screenshot` | Yes | Upload screenshot untuk verifikasi |
| GET | `/api/tugas/stats` | Yes | Statistik task member (tugas_ai + tugas_ai_2) |
| GET | `/api/tugas-ai-2/[id]` | Yes | Detail screenshot task |

### 7.3 Coins & Rewards
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/coins` | Yes | Balance + history coin member |
| POST | `/api/rewards/redeem` | Yes | Redeem reward (pessimistic locking) |
| GET | `/api/rewards/access-test` | Yes | Test akses reward BerkomunitasPlus |

### 7.4 Profile
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET/PUT | `/api/profil` | Yes | Get/update profile |
| GET | `/api/profil/check-completeness` | Yes | Cek kelengkapan profil |
| GET | `/api/profil/check-duplicate` | Yes | Cek duplikat data |
| GET | `/api/profil/dashboard` | Yes | Data dashboard profil |
| PUT | `/api/profil/email` | Yes | Update email |
| GET | `/api/profil/loyalty` | Yes | History loyalty |
| POST | `/api/profil/upload-foto` | Yes | Upload foto profil |
| GET/PUT | `/api/profil/username` | Yes | Manage username |
| GET | `/api/profil/wall` | Yes | Profile wall posts |
| GET | `/api/profil/[username]` | No | Public profile by username |

### 7.5 Leaderboard
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/leaderboard` | No | Top 50 loyalty + comments |
| GET | `/api/leaderboard/infinite` | No | Infinite scroll (`type`, `page`, `limit`) |

### 7.6 Events
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/events` | Admin | List semua events |
| POST | `/api/events` | Admin | Buat event baru |
| PUT | `/api/events/[setting_name]` | Admin | Update event |
| DELETE | `/api/events/[setting_name]` | Admin | Hapus event |
| GET | `/api/events/public` | No | Event yang sedang aktif |

### 7.7 Notifications
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/notifikasi` | Yes | List notifikasi (pagination, filter unread) |
| POST | `/api/notifikasi` | Yes | Mark as read (specific IDs / all) |
| DELETE | `/api/notifikasi` | Yes | Delete notifications |

### 7.8 Members
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/members` | Yes | List semua members |
| GET | `/api/members/current` | Yes | Data member yang login |
| POST | `/api/create-member` | Yes | Buat member baru |

### 7.9 DRW Corp
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/drwcorp/employees` | Yes | List karyawan + filter |
| GET | `/api/drwcorp/search-members` | Yes | Cari member (untuk matching) |
| GET | `/api/drwcorp/task-completion` | Yes | Task completion per karyawan |

### 7.10 Task Submissions
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/task-submissions` | Yes | Submissions member tertentu |
| POST | `/api/task-submissions/timeout` | System | Mark timed-out submissions |

### 7.11 Admin API Endpoints

#### Dashboard & Auth
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admin/dashboard` | Dashboard stats (global, daily, aggregates) |
| GET | `/api/admin/check` | Check admin privilege |
| GET | `/api/admin/check-status` | Check admin + member info |

#### Task Management (Admin)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admin/tugas` | List tasks (both tugas_ai & tugas_ai_2) |
| POST | `/api/admin/tugas` | Create task + notify all members |
| GET | `/api/admin/tugas/[id]` | Task detail + submissions |
| PUT | `/api/admin/tugas/[id]` | Update task |
| DELETE | `/api/admin/tugas/[id]` | Delete task |
| GET | `/api/admin/tugas/stats` | Task statistics |

#### Screenshot Task Management (Admin)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admin/tugas-ai-2` | List screenshot tasks |
| POST | `/api/admin/tugas-ai-2` | Create screenshot task |
| GET | `/api/admin/tugas-ai-2/[id]` | Detail + screenshots |
| PUT | `/api/admin/tugas-ai-2/[id]` | Update screenshot task |
| DELETE | `/api/admin/tugas-ai-2/[id]` | Delete (cascade screenshots) |

#### Submission Verification (Admin)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| PUT | `/api/admin/task-submissions/[id]` | Verify/reject submission → awards points |

#### Member Management (Admin)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admin/members` | List all members |
| GET | `/api/admin/members/[id]` | Member detail |
| PUT | `/api/admin/members/[id]` | Update member (+ username + email, atomic) |
| DELETE | `/api/admin/members/[id]` | Delete member |

#### Coins & Points (Admin)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admin/coins` | Coin history + filters |
| POST | `/api/admin/coins/manual` | Manual coin adjustment |
| GET | `/api/admin/points` | Loyalty history + filters |
| POST | `/api/admin/points/manual` | Manual loyalty adjustment |
| POST | `/api/admin/points/correction` | Point correction |

#### Rewards (Admin)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admin/rewards` | List rewards + categories |
| POST | `/api/admin/rewards` | Create reward |
| PUT | `/api/admin/rewards/[id]` | Update reward |
| DELETE | `/api/admin/rewards/[id]` | Delete reward |
| POST | `/api/admin/rewards/upload-foto` | Upload reward image (max 5MB) |

#### Redemptions (Admin)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admin/redemptions` | List redemptions + status filter |
| PUT | `/api/admin/redemptions/[id]/status` | Update status (refund on reject) |

#### Badges (Admin)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET/POST | `/api/admin/badges` | List / create badges |
| PUT/DELETE | `/api/admin/badges/[id]` | Update / delete badge |
| GET | `/api/admin/member-badges` | List member-badge assignments |
| POST | `/api/admin/member-badges/batch` | Batch assign badge |
| DELETE | `/api/admin/member-badges/remove` | Remove badge from member |

#### Privileges (Admin)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admin/privileges` | List all privileges |
| POST | `/api/admin/privileges` | Grant privilege (by email) |

#### Social Media (Admin)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admin/social-media` | List members + social profiles |
| PUT | `/api/admin/social-media/[id]` | Update social profile |
| DELETE | `/api/admin/social-media/[id]` | Delete social profile |

#### Levels (Admin)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET/POST | `/api/admin/levels` | List / create levels |
| PUT/DELETE | `/api/admin/levels/[id]` | Update / delete level |

#### Other Admin
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/admin/generate-photos` | Generate avatar for members without photo |
| POST | `/api/admin/reward-categories` | Create reward category |

---

## 8. Frontend Pages & Components

### Halaman Publik (Tanpa Login)
| Route | Halaman | Deskripsi |
|-------|---------|-----------|
| `/` | Homepage | Landing page + stats + partner showcase |
| `/landing` | Alternate Landing | Video hero, fitur, CTA pendaftaran |
| `/login` | Login | Google OAuth login |
| `/faq` | FAQ | Searchable FAQ dengan kategori |
| `/user-guide` | User Guide | Panduan penggunaan (accordion) |
| `/privacy-policy` | Privacy Policy | Kebijakan privasi |
| `/terms` | Terms & Conditions | Syarat & ketentuan |
| `/maintenance` | Maintenance | Halaman maintenance |

### Halaman User (Perlu Login)
| Route | Halaman | Deskripsi |
|-------|---------|-----------|
| `/profil` | Profile Dashboard | Tab: Edit Profil, Rewards History, Lencana |
| `/profil/[username]` | Public Profile | Lihat profil member lain |
| `/tugas` | Tugas | List tugas + filter + infinite scroll + Event Boost |
| `/tugas/[id]` | Detail Tugas | Detail task individual |
| `/leaderboard` | Leaderboard | Ranking loyalty & komentar |
| `/rewards` | Rewards Catalog | Browse & redeem reward dengan coin |
| `/coins` | Coin History | Riwayat transaksi coin |
| `/loyalty` | Loyalty History | Riwayat transaksi loyalty point |
| `/notifikasi` | Notifications | Notifikasi dengan kategori & filter |
| `/security` | Account Security | Password, Active Devices, Delete Account |
| `/plus` | BC Connection | Verifikasi Beauty Consultant DRW Skincare |
| `/drwcorp` | DRW Corp Dashboard | Task completion tracker per divisi |

### Komponen Shared Utama
| Komponen | File | Fungsi |
|----------|------|--------|
| `GlassLayout` | `src/components/GlassLayout.js` | Glass morphism wrapper + variants (default/admin/dark/sunset/ocean) |
| `AdminComponents` | `src/components/AdminComponents.js` | Admin UI: PageLayout, StatsGrid, TableContainer, SearchInput, StatusBadge |
| `NavigationMenu` | `src/app/components/NavigationMenu.js` | Navbar + NotificationBell + UserDropdown + coin/point display |
| `EventBoostComponents` | `src/components/EventBoostComponents.js` | Event boost banner + point multiplier display |
| `GoogleLoginButton` | `src/components/GoogleLoginButton.js` | Reusable Google OAuth button |
| `ShippingForm/Tracker` | `src/components/Shipping*.js` | Form alamat pengiriman + tracking |
| `ProfileCompletionBanner` | `src/components/ProfileCompletionBanner.js` | Warning jika profil belum lengkap |
| `ProfileGatedButton` | `src/components/ProfileGatedButton.js` | Button yang butuh profil lengkap |
| `WilayahDropdown` | `src/components/WilayahDropdown.js` | Dropdown provinsi/kab/kec Indonesia |
| `RankingCanvas` | `src/components/ranking/RankingCanvas.js` | Canvas-based ranking visualization |

### Glass Theme System
Platform menggunakan **glass morphism** design yang bisa dikustomisasi. Dikonfigurasi lewat `GlassThemeProvider` di root layout.

Variants: `default`, `admin`, `dark`, `sunset`, `ocean`

---

## 9. Admin Panel

**URL:** `admin.berkomunitas.com` (atau `/admin-app/` path)

### Fitur Admin

| Menu | Route | Deskripsi |
|------|-------|-----------|
| Dashboard | `/admin-app/dashboard` | KPI cards + charts (Recharts): member growth, comments, loyalty trends |
| Members | `/admin-app/members` | CRUD member, edit profil, social media |
| Tasks | `/admin-app/tasks` | Manage tugas comment (tugas_ai + tugas_ai_2) |
| Add Task | `/admin-app/add-task` | Form buat tugas baru + AI verification rules |
| Events | `/admin-app/events` | CRUD event boost (start/end date, multiplier) |
| Coins | `/admin-app/coins` | History coin + manual adjustment (add/subtract) |
| Loyalty | `/admin-app/loyalty` | History loyalty + manual adjustment |
| Points | `/admin-app/points` | Points management + add-point modal |
| Badges | `/admin-app/badges` | CRUD badge + member assignment (Shields.io rendering) |
| Privileges | `/admin-app/privileges` | Assign roles: user/moderator/admin/super_admin |
| Social Media | `/admin-app/social-media` | Manage profil sosmed member |
| Statistics | `/admin-app/statistics` | Overview cards + charts |

### Admin Authentication
1. User login via Google OAuth (same as regular user)
2. System checks `user_privileges` table for `privilege = 'admin'` yang `is_active = true`
3. API routes use `requireAdmin()` atau inline privilege check

---

## 10. Rewards App

**URL:** `rewards.berkomunitas.com` (atau `/rewards-app/` path)

Sub-app terpisah untuk partner/admin mengelola reward dan fulfillment.

| Route | Deskripsi |
|-------|-----------|
| `/rewards-app/dashboard` | Stats: total rewards, redemptions, pending, shipped, delivered, rejected, monthly trends |
| `/rewards-app/rewards` | CRUD reward + upload foto + category + stock + privilege requirement |
| `/rewards-app/status` | Manage redemption status + shipping tracking + detail modal |

### Redemption Flow
```
Member redeem reward (coin deducted)
    → Status: menunggu_verifikasi
    → Admin review di rewards-app
    → Status: diproses
    → Admin kirim barang
    → Status: dikirim (+ tracking number)
    → Member terima
    → Status: diterima
    
    ATAU
    
    → Status: ditolak → coin + stock refunded
```

---

## 11. Sistem Tugas (Task System)

### Dua Jenis Tugas

#### 1. Tugas AI (Auto-Verify via Comment)
- Tabel: `tugas_ai`
- Member diminta comment di post Instagram/Facebook
- n8n workflow men-scrape komentar dan match username + keyword
- Jika cocok → otomatis `selesai` + award poin
- Jika tidak cocok setelah batas waktu → `gagal_diverifikasi`

#### 2. Tugas AI 2 (Screenshot Verification)
- Tabel: `tugas_ai_2`
- Member upload screenshot bukti komentar
- Screenshot disimpan di MinIO
- n8n workflow (atau admin) memverifikasi screenshot
- Field AI: `ai_extracted_text`, `ai_confidence_score`, `ai_verification_result`

### Task Lifecycle

```
Tugas dibuat (admin/AI)
    │
    ▼
Member lihat di /tugas (status: tersedia)
    │
    ▼
Member klik "Kerjakan" → waktu_klik recorded
    │
    ├── [Auto-Verify] n8n scrape comment → match
    │   └── selesai → award poin + coin + notifikasi
    │
    ├── [Screenshot] Member upload screenshot
    │   └── sedang_verifikasi → admin/AI check → selesai/gagal
    │
    └── Timeout (4 jam) → gagal_diverifikasi
```

### Event Boost System
```
EVENT_BOOST_SETTINGS = {
  MAIN_EVENT:     300%,  // 3x poin
  WEEKEND_BOOST:  200%,  // 2x poin
  SPECIAL_BOOST:  500%   // 5x poin
}
```
Admin bisa buat event di `/admin-app/events` dengan start/end date. Saat aktif, poin dari task dikalikan multiplier.

---

## 12. Sistem Poin & Coin (Dual Currency)

### Konsep

```
┌────────────────────┐     ┌────────────────────┐
│   LOYALTY POINT    │     │       COIN          │
│                    │     │                     │
│  - Selalu naik     │     │  - Bisa berkurang   │
│  - Tidak bisa      │     │  - Digunakan untuk  │
│    dibelanjakan    │     │    redeem reward     │
│  - Menentukan rank │     │  - Saldo = loyalty   │
│  - Menentukan level│     │    poin - coin yg    │
│                    │     │    sudah dipakai     │
└────────────────────┘     └────────────────────┘

Saat member complete task:
  loyalty_point += task_value (× boost multiplier)
  coin          += task_value (× boost multiplier)

Saat member redeem reward:
  coin -= reward_cost
  loyalty_point TIDAK berubah

INVARIANT: coin <= loyalty_point (selalu!)
```

### File yang Mengelola
| File | Fungsi |
|------|--------|
| `lib/coinLoyaltyManager.js` | `CoinLoyaltyManager` class — `addLoyaltyPoints()`, `redeemCoins()` |
| `lib/prisma-with-sync-middleware.js` | Prisma middleware untuk auto-sync coin + loyalty_point |
| `coin_history` | Tabel riwayat coin |
| `loyalty_point_history` | Tabel riwayat loyalty |
| `member_transactions` | Tabel transaksi terpadu |

### Ranking System (19 Level Islami)
Berdasarkan `loyalty_point` di tabel `members`:

**7 Level Surga (Top):**
- Jannatul Firdaus (100,000+)
- Al-Maqamul Amin (96,000+)
- Jannatul 'Adn (88,000+)
- Darul Muqamah, Darul Maqamah, Darus Salam, Jannatul Ma'wa

**5 Level Dunia (Middle):**
- Al-Muqarrabun, Ash-Shabiqun, Al-Mujahidun, Al-Mu'minun, Al-Muslimun

**7 Level Neraka (Low):**
- Jahannam, Laza, dll.

File: `lib/rankingLevels.js`

---

## 13. Integrasi n8n (Workflow Automation)

### Overview
n8n digunakan sebagai **external workflow engine** yang terhubung ke database dan API Berkomunitas. Berjalan di server terpisah (kemungkinan `n8n.drwapp.com`).

### Workflow yang Diketahui

#### 1. Instagram Comment Scraping
- **Trigger:** Scheduled/cron
- **Proses:**
  1. Ambil data `instagram_accounts` dari DB
  2. Scrape komentar dari post Instagram via API
  3. Simpan ke tabel `comments` dan `media`
  4. Update `rekomendasi_tugas` dan `rekomendasi_keyword` di `media`
- **Tabel terkait:** `instagram_accounts`, `instagram_master_config`, `media`, `comments`

#### 2. Facebook Comment Scraping
- **Trigger:** Scheduled/cron
- **Proses:**
  1. Ambil `facebook_pages` yang aktif dari DB
  2. Scrape post dan comments via Facebook Graph API
  3. Simpan ke `facebook_posts`, `facebook_comments`
  4. Log eksekusi di `facebook_execution_log`
- **Tabel terkait:** `facebook_pages`, `facebook_posts`, `facebook_comments`, `facebook_execution_log`

#### 3. Task Auto-Verification (VALIDASI TUGAS)
- **Trigger:** Webhook dari `task_submissions` (INSERT/UPDATE)
- **Proses:**
  1. Terima data submission baru
  2. Query komentar di tabel `comments` berdasarkan `source_profile_link`
  3. Match username + keyword tugas
  4. Jika cocok → UPDATE `task_submissions.status_submission = 'selesai'`
  5. Award poin + coin ke member
- **Env:** `N8N_TASK_START_WEBHOOK_URL`

#### 4. Screenshot Verification
- **Trigger:** Webhook saat screenshot di-upload
- **Proses:**
  1. Ambil screenshot dari MinIO
  2. OCR / AI extract text dari screenshot
  3. Bandingkan dengan `verification_rules` (required_keywords, min_confidence)
  4. Update `tugas_ai_2_screenshots` dengan:
     - `ai_extracted_text`
     - `ai_confidence_score`
     - `ai_verification_result` (JSON)
     - `n8n_execution_id`
- **Env:** `N8N_SCREENSHOT_VERIFICATION_WEBHOOK`
- **Database columns:** `n8n_webhook_id`, `n8n_execution_id` di `tugas_ai_2_screenshots`

#### 5. Facebook Auto-Comment (Trigger Queue)
- **Trigger:** New entry di `facebook_trigger_comment_queue`
- **Proses:**
  1. Ambil target post + caption
  2. Post komentar ke Facebook page
  3. Update `posted_comment_id_1/2`, `status`
  4. Track `attempt_count`, `error_message`

#### 6. TikTok Content Scraping
- **Trigger:** Scheduled
- **Proses:** Scrape konten TikTok, simpan ke `tiktok_contents`
- **Script terkait:** `scripts/scrape-tiktok-drwskincare.py`

#### 7. Tugas AI Generation
- **Trigger:** Setelah scraping selesai
- **Proses:**
  1. Ambil media/post baru yang belum ada tugasnya
  2. Generate `rekomendasi_tugas` dan `rekomendasi_keyword` (via AI)
  3. Buat entry baru di `tugas_ai` atau `facebook_tugas_ai`

### n8n ↔ Berkomunitas Integration Points

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   n8n        │◄───────►│  PostgreSQL   │◄───────►│ Berkomunitas  │
│  Workflow    │  Direct  │  Database    │  Prisma  │  API Routes  │
│  Engine     │  SQL     │              │  ORM     │              │
└──────┬──────┘         └──────────────┘         └──────┬───────┘
       │                                                 │
       │  Webhooks                                       │
       ├──────────────────────────────────────────────────┤
       │                                                 │
       │  POST /webhook/task-verify                      │
       │  POST /webhook/screenshot-verify                │
       │  POST /webhook/facebook-scrape                  │
       │  POST /webhook/instagram-scrape                 │
       └─────────────────────────────────────────────────┘
```

**PENTING:** n8n mengakses database **langsung** via SQL (bukan lewat API Next.js). Ini berarti:
- n8n bisa baca/tulis tabel tanpa melewati validasi API
- Perlu sinkronisasi jika ada perubahan schema
- Connection pool harus dipertimbangkan (n8n + Next.js + Prisma)

---

## 14. Integrasi Pihak Ketiga

### Google OAuth
- **Purpose:** Login utama
- **Libraries:** `google-auth-library`, `@react-oauth/google`
- **Config:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### MinIO (S3-Compatible Storage)
- **Purpose:** Penyimpanan file utama (foto profil, screenshot)
- **Library:** `@aws-sdk/client-s3`
- **Config:** `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`
- **File:** `lib/storage.js`
- **Priority:** MinIO > VPS > Cloudinary > Local

### Cloudinary
- **Purpose:** Image CDN (legacy fallback)
- **Config:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Status:** Sedang dimigrasi ke MinIO

### DiceBear / UI Avatars
- **Purpose:** Generate avatar default untuk member tanpa foto
- **Endpoint:** `https://api.dicebear.com/7.x/`

### Shields.io
- **Purpose:** Rendering badge di admin panel

### Facebook Graph API
- **Purpose:** Scraping page/post/comments Facebook
- **Diakses via:** n8n workflow + `page_access_token` di `facebook_pages`

### Instagram API
- **Purpose:** Scraping media/comments Instagram
- **Diakses via:** n8n workflow + `page_access_token` di `instagram_accounts`

### Clerk (DEPRECATED)
- **Purpose:** Auth lama (sudah dimigrasi ke custom SSO)
- **Sisa:** Webhook handler di `/api/webhooks/clerk` masih ada
- **Catatan:** Jangan gunakan lagi

---

## 15. Library & Utilities

### Server-Side Libraries (`lib/`)

| File | Export Utama | Deskripsi |
|------|-------------|-----------|
| `prisma.js` | `default: PrismaClient` | Singleton Prisma client, connection limit 2 (prod) / 10 (dev), graceful shutdown |
| `prisma-retry.js` | `retryPrismaOperation(op, maxRetries, delay)` | Retry + exponential backoff untuk DB errors |
| `prisma-with-sync-middleware.js` | Prisma instance + `syncAllCoinWithLoyalty()` | Middleware auto-sync coin ↔ loyalty_point |
| `sso.js` | `loginWithGoogle()`, `verifyToken()`, `refreshToken()`, `getCurrentUser()`, `logout()` | Client-side SSO helpers |
| `ssoAuth.js` | `getCurrentUser(request)`, `requireAuth()`, `withSSOAuth()` | Server-side JWT auth |
| `adminAuth.js` | `requireAdmin(request)` | Check admin privilege (via x-user-email header) |
| `requireAdmin.js` | `requireAdmin(request)` | Check admin from user_privileges table |
| `storage.js` | `uploadToMinIO()`, `deleteFromMinIO()`, `createMinIOClient()` | Unified storage (MinIO primary) |
| `coinLoyaltyManager.js` | `CoinLoyaltyManager` class | `addLoyaltyPoints()`, `redeemCoins()`, `addCoins()`, `deductCoins()` |
| `taskNotifications.js` | `createTaskNotification()`, `createBulkTaskNotifications()`, dll | Factory notifikasi task (create rows di `notifications`) |
| `rewardNotifications.js` | `createRewardRedemptionNotification()`, `createRewardStatusNotification()` | Factory notifikasi reward |
| `apiClient.js` | `getTasks()`, `getTaskStatuses()` | Client-side fetch wrapper untuk task API |
| `rankingLevels.js` | `RANKING_LEVELS` (array 19 level) | Sistem ranking Islami |
| `bigIntUtils.js` | `convertBigInt(obj)`, `convertBigIntsInArray(arr)` | BigInt → Number untuk JSON serialization |
| `drwcorp-employees.js` | `DRW_CORP_EMPLOYEES` (array 53 nama) | Static employee roster (in-memory) |

### Client-Side Utilities (`src/utils/`)

| File | Export Utama | Deskripsi |
|------|-------------|-----------|
| `privilegeChecker.js` | `hasPrivilege()`, `checkUserPrivileges()`, `canAccessFeature()`, `grantPrivilege()` | Sistem privilege 4 tier (PRIMARY) |
| `hierarchicalPrivilegeChecker.js` | Same exports (near-duplicate) | **DEPRECATED** — duplicate of privilegeChecker, has missing import bug |
| `generateUsername.js` | `generateUniqueUsername()`, `createUsernameForMember()`, `ensureMemberHasUsername()` | Auto-generate username untuk member baru |
| `prisma.js` | `default: PrismaClient` | Alternative Prisma import (dari `src/utils/`) |

---

## 16. Hooks (React Client-Side)

| Hook | File | Return Value | Deskripsi |
|------|------|-------------|-----------|
| `useSSOUser()` | `src/hooks/useSSOUser.js` | `{ user, isLoaded, isSignedIn }` | Auth state utama (replaces Clerk's useUser) |
| `useAdminStatus()` | `src/hooks/useAdminStatus.js` | `{ isAdmin, loading }` | Check admin privilege |
| `useProfileCompletion()` | `src/hooks/useProfileCompletion.js` | `{ isComplete, loading, member, socialMediaProfiles, refresh() }` | Cek kelengkapan profil |
| `useEventBoost(type)` | `src/hooks/useEventBoost.js` | `{ eventConfig, isActive, boostPercentage, pointValue, activateEvent(), ... }` | Event boost state + management |
| `useMultipleEventBoost()` | `src/hooks/useMultipleEventBoost.js` | Multiple event boost configs | Handle banyak event aktif sekaligus |
| `useAutoScroll()` | `src/hooks/useAutoScroll.js` | Scroll utilities | Auto scroll behavior |
| `useGlassTheme()` | `src/hooks/useGlassTheme.js` | Theme context | Glass morphism theme |

---

## 17. Environment Variables

### Required (Wajib)
```bash
# Database
DATABASE_URL="postgresql://user:pass@host:port/db?connection_limit=20&pool_timeout=20"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"

# JWT (min 32 karakter)
JWT_SECRET="your-jwt-secret-32-chars-minimum"
JWT_REFRESH_SECRET="your-refresh-secret-32-chars-minimum"
```

### Storage
```bash
# MinIO (Primary)
MINIO_ENDPOINT="minio.yourdomain.com"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="your-secret-key"
MINIO_BUCKET="berkomunitas"
MINIO_REGION="us-east-1"
MINIO_USE_SSL="true"

# Cloudinary (Legacy)
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="xxx"
CLOUDINARY_API_SECRET="xxx"
CLOUDINARY_UPLOAD_PRESET="xxx"
```

### n8n Integration
```bash
N8N_TASK_START_WEBHOOK_URL="https://n8n.drwapp.com/webhook/task-start"
N8N_SCREENSHOT_VERIFICATION_WEBHOOK="https://n8n.drwapp.com/webhook/screenshot-verify"
```

### Database Pool
```bash
DATABASE_POOL_SIZE=20
DATABASE_POOL_TIMEOUT=20
DATABASE_IDLE_TIMEOUT=30
```

### Optional
```bash
NEXT_PUBLIC_SSO_API_URL="/api/sso"
NODE_ENV="production"
```

---

## 18. Deployment (Vercel)

### Config (`vercel.json`)
```json
{
  "functions": {
    "src/app/api/**/*.js": { "maxDuration": 30 }
  },
  "rewrites": [
    // admin.berkomunitas.com → /admin-app/
    // rewards.berkomunitas.com → /rewards-app/
  ]
}
```

### Deploy Steps
1. Push ke branch `main` → auto-deploy ke Vercel
2. Branch `development` untuk development
3. Environment variables di Vercel Dashboard → Settings → Environment Variables
4. Build command: `prisma generate && next build`

### Subdomain Setup
- `berkomunitas.com` → main app
- `admin.berkomunitas.com` → admin panel (rewrite ke `/admin-app/`)
- `rewards.berkomunitas.com` → rewards app (rewrite ke `/rewards-app/`)

### Post-Deployment Checks
1. Test login: `https://berkomunitas.com/login`
2. Test API: `https://berkomunitas.com/api/sso/verify-token`
3. Test admin: `https://admin.berkomunitas.com`
4. Check Vercel build logs untuk errors

---

## 19. Known Issues & Technical Debt

### Bugs yang Diketahui
| # | Issue | File | Severity |
|---|-------|------|----------|
| 1 | `getTaskStatuses` references undeclared `memberId` | `lib/apiClient.js` | Medium |
| 2 | `hierarchicalPrivilegeChecker.js` missing `prisma` import — will crash | `src/utils/hierarchicalPrivilegeChecker.js` | High |
| 3 | Ada 2 Prisma client instances (bisa double connection pool) | `lib/prisma.js` + `lib/prisma-with-sync-middleware.js` | Medium |
| 4 | `ssoAuth.js` imports dari `@/utils/prisma` bukan `@/lib/prisma` | `lib/ssoAuth.js` | Low |

### Technical Debt
| # | Item | Deskripsi |
|---|------|-----------|
| 1 | **Clerk leftovers** | Masih ada webhook handler, `clerk_id` di schema, middleware.js root level |
| 2 | **Duplicate privilege checker** | `privilegeChecker.js` dan `hierarchicalPrivilegeChecker.js` harus dimerge |
| 3 | **Dual Prisma client** | `prisma-with-sync-middleware.js` buat client sendiri — harus unified |
| 4 | **Mock data di admin stats** | `/api/admin/stats/overview` dan `/api/admin/stats/members` masih return mock data |
| 5 | **`facebook_task_submissions`** | Tabel terpisah dari `task_submissions` — belum unified |
| 6 | **Cloudinary → MinIO migration** | Masih in-progress, beberapa URL masih Cloudinary |
| 7 | **createTaskSubmission deprecated** | Fungsi di `apiClient.js` sudah deprecated, perlu cleanup |
| 8 | **DRW Corp employees in-memory** | Daftar karyawan hardcoded di JS, bukan di DB — akan hilang saat restart |

### Proposal yang Belum Diimplementasi
- **Unified Task System** — Merge `tugas_ai` + `tugas_ai_2` + `facebook_tugas_ai` submission ke satu `task_submissions` table (ada proposal detail di `PROPOSAL_UNIFIED_TASK_SYSTEM.md`)

---

## 20. Panduan untuk AI Agent

### Aturan Dasar

1. **Jangan pernah** hapus atau ubah `prisma/schema.prisma` tanpa konfirmasi — ini schema utama database production
2. **Selalu gunakan** `lib/prisma.js` untuk import Prisma client (bukan yang di `src/utils/prisma.js`)
3. **Auth pattern:** Server-side gunakan `getCurrentUser(request)` dari `lib/ssoAuth.js`
4. **Admin check:** Gunakan `requireAdmin(request)` dari `lib/requireAdmin.js`
5. **Poin changes:** Selalu melalui `CoinLoyaltyManager` untuk menjaga konsistensi coin ↔ loyalty

### Saat Membuat API Route Baru
```javascript
// Template API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';          // BUKAN @/utils/prisma
import { getCurrentUser } from '@/lib/ssoAuth';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // ... logic
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Saat Membuat Komponen Frontend Baru
```javascript
'use client';
import { useSSOUser } from '@/hooks/useSSOUser';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

export default function MyComponent() {
  const { user, isLoaded, isSignedIn } = useSSOUser();
  const { isComplete } = useProfileCompletion();
  
  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <LoginPrompt />;
  
  // ... component
}
```

### Saat Modifikasi Poin/Coin
```javascript
import { CoinLoyaltyManager } from '@/lib/coinLoyaltyManager';

// BENAR: Gunakan CoinLoyaltyManager
await CoinLoyaltyManager.addLoyaltyPoints(memberId, points, 'Task completed', 'task');
await CoinLoyaltyManager.redeemCoins(memberId, 50, rewardId, 'Reward Name');

// SALAH: Langsung update members table
// await prisma.members.update({ where: { id: memberId }, data: { coin: { increment: 10 } } });
```

### Saat Perlu Membuat Notifikasi
```javascript
import { createTaskCompletionNotification } from '@/lib/taskNotifications';
import { createRewardStatusNotification } from '@/lib/rewardNotifications';

// Task notification
await createTaskCompletionNotification(memberId, taskKeyword, pointsEarned);

// Reward notification
await createRewardStatusNotification(memberId, rewardName, 'dikirim', 0);
```

### Import Path Reference
| Import | File Asli | Gunakan Untuk |
|--------|-----------|---------------|
| `@/lib/prisma` | `lib/prisma.js` | Prisma client (PRIMARY) |
| `@/lib/ssoAuth` | `lib/ssoAuth.js` | Server auth |
| `@/lib/sso` | `lib/sso.js` | Client auth |
| `@/hooks/useSSOUser` | `src/hooks/useSSOUser.js` | Client auth hook |
| `@/lib/coinLoyaltyManager` | `lib/coinLoyaltyManager.js` | Manage coin/loyalty |
| `@/lib/storage` | `lib/storage.js` | File upload (MinIO) |
| `@/lib/taskNotifications` | `lib/taskNotifications.js` | Task notifications |
| `@/lib/rewardNotifications` | `lib/rewardNotifications.js` | Reward notifications |
| `@/utils/privilegeChecker` | `src/utils/privilegeChecker.js` | Privilege check |

### Database Connection Notes
- **Production:** `connection_limit=2` per Prisma instance (hemat pool)
- **Development:** `connection_limit=10`
- n8n juga makan connection pool — total harus < max DB connections
- Gunakan `retryPrismaOperation()` dari `lib/prisma-retry.js` untuk operasi yang bisa fail karena cold start

### n8n Coordination
- n8n langsung akses PostgreSQL (bypass API)
- Jika ubah schema tabel yang diakses n8n, **harus update n8n workflow juga**
- Tabel yang diakses n8n: `comments`, `media`, `task_submissions`, `tugas_ai`, `tugas_ai_2_screenshots`, `facebook_*`, `instagram_*`, `tiktok_contents`
- n8n webhook URLs di env: `N8N_TASK_START_WEBHOOK_URL`, `N8N_SCREENSHOT_VERIFICATION_WEBHOOK`

---

## Appendix: Daftar Semua Model Database

| # | Model | Rows (approx) | Deskripsi Singkat |
|---|-------|---------------|-------------------|
| 1 | `members` | ~80+ | Member/user utama |
| 2 | `user_usernames` | ~80+ | Username unik |
| 3 | `member_emails` | ~80+ | Multi-email per member |
| 4 | `profil_sosial_media` | varies | Akun sosmed member |
| 5 | `user_privileges` | varies | Role: user/berkomunitasplus/partner/admin |
| 6 | `PlatformSession` | varies | Session login aktif |
| 7 | `UserActivity` | varies | Log aktivitas |
| 8 | `tugas_ai` | varies | Task auto-verify |
| 9 | `tugas_ai_2` | varies | Task screenshot |
| 10 | `task_submissions` | varies | Pengerjaan task |
| 11 | `tugas_ai_2_screenshots` | varies | Screenshot uploads |
| 12 | `facebook_tugas_ai` | varies | Task Facebook |
| 13 | `facebook_task_submissions` | varies | Submission Facebook |
| 14 | `coin_history` | varies | Riwayat coin |
| 15 | `loyalty_point_history` | varies | Riwayat loyalty |
| 16 | `loyalty_point_rules` | ~few | Aturan poin per event |
| 17 | `member_transactions` | varies | Transaksi terpadu |
| 18 | `transaction_types` | ~10 | Tipe transaksi |
| 19 | `rewards` | varies | Katalog reward |
| 20 | `reward_categories` | ~few | Kategori reward |
| 21 | `reward_redemptions` | varies | Riwayat penukaran |
| 22 | `badges` | ~10 | Definisi badge |
| 23 | `member_badges` | varies | Badge per member |
| 24 | `levels` | ~20 | Definisi level |
| 25 | `notifications` | varies | Notifikasi |
| 26 | `media` | varies | Media Instagram |
| 27 | `comments` | varies | Komentar IG/TikTok |
| 28 | `facebook_pages` | ~10 | Halaman Facebook |
| 29 | `facebook_posts` | varies | Post Facebook |
| 30 | `facebook_comments` | varies | Komentar Facebook |
| 31 | `facebook_execution_log` | varies | Log scraping |
| 32 | `facebook_trigger_comment_queue` | varies | Queue auto-comment |
| 33 | `instagram_accounts` | ~few | Akun IG managed |
| 34 | `instagram_master_config` | 1 | Config Instagram |
| 35 | `tiktok_contents` | varies | Konten TikTok |
| 36 | `bc_drwskincare_api` | varies | Data reseller DRW |
| 37 | `bc_drwskincare_plus` | varies | Koneksi member-reseller |
| 38 | `bc_drwskincare_plus_verified` | varies | Reseller terverifikasi |
| 39 | `drwcorp_employees` | ~53 | Karyawan DRW Corp |
| 40 | `partners` | ~few | Partner platform |
| 41 | `event_settings` | ~few | Event boost configs |
| 42 | `statistik_global` | ~few | Stats global |
| 43 | `statistik_harian` | varies | Stats harian |
| 44 | `system_logs` | varies | Log sistem |
| 45 | `member_task_stats` | varies | Cache stats task |
| 46 | `peringkat_member_loyalty` | varies | Leaderboard loyalty |
| 47 | `peringkat_member_comments` | varies | Leaderboard komentar |
| 48 | `peringkat_sumber_tugas` | varies | Ranking sumber tugas |
| 49 | `peringkat_tugas_populer` | varies | Ranking tugas populer |
| 50 | `RegisteredPlatform` | ~few | Platform terdaftar SSO |
| 51 | `SocialLink` | varies | Social links |
| 52 | `profile_wall_posts` | varies | Wall post di profil |

---

> **Dokumen ini dibuat otomatis berdasarkan analisis codebase pada 6 Maret 2026.**  
> **Untuk pertanyaan, hubungi tim development atau buat issue di repository.**
