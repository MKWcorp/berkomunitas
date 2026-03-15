# 📕 DOKUMENTASI 4: FRONTEND, N8N, & DEPLOYMENT

## Berkomunitas — Pages, Components, Hooks, n8n Workflows, Deployment, AI Guide

> Dokumen ini menjelaskan semua halaman frontend, komponen UI, custom hooks, integrasi n8n, deployment guide, known issues, dan panduan untuk AI agent.

---

## Daftar Isi

1. [Frontend Architecture](#1-frontend-architecture)
2. [Halaman Main Site](#2-halaman-main-site)
3. [Halaman Admin Panel](#3-halaman-admin-panel)
4. [Halaman Rewards App](#4-halaman-rewards-app)
5. [UI Components Library](#5-ui-components-library)
6. [Custom React Hooks](#6-custom-react-hooks)
7. [Utility Functions](#7-utility-functions)
8. [n8n Workflow Integration](#8-n8n-workflow-integration)
9. [Deployment & Infrastructure](#9-deployment--infrastructure)
10. [Scripts & Maintenance Tools](#10-scripts--maintenance-tools)
11. [Known Issues & Technical Debt](#11-known-issues--technical-debt)
12. [Panduan untuk AI Agent / Copilot](#12-panduan-untuk-ai-agent--copilot)

---

## 1. Frontend Architecture

### Rendering Strategy

| Route Type | Rendering | Contoh |
|-----------|-----------|--------|
| Landing Page | SSR (server) | `/` |
| Profile Pages | Client-side + SWR | `/profil`, `/profil/[username]` |
| Task Pages | Client-side + fetch | `/tugas`, `/tugas/[id]` |
| Admin Panel | Client-side (fully) | `/admin-app/panel/*` |
| Rewards App | Client-side + fetch | `/rewards-app/*` |
| API Routes | Server-side | `/api/*` |

### State Management

- **Tidak ada global state library** (no Redux, Zustand, Jotai)
- Tiap halaman fetch data sendiri via `fetch()` atau custom hooks
- Auth state via `useAuth()` hook (reads localStorage + verifies JWT)
- Theme state via `next-themes` (dark/light)

### Routing

```
berkomunitas.com/*           → src/app/(main)/*
berkomunitas.com/login       → src/app/(auth)/login/page.js
berkomunitas.com/register    → src/app/(auth)/register/page.js
admin.berkomunitas.com/*     → src/app/admin-app/*
rewards.berkomunitas.com/*   → src/app/rewards-app/*
```

---

## 2. Halaman Main Site

### 2.1 Landing Page (`/`)

**File:** `src/app/page.js`

- Hero section dengan animasi
- Statistik komunitas (dari `/api/landing-stats`, cached 1 jam)
- Preview leaderboard
- CTA untuk register/login
- Responsive (mobile-first)

### 2.2 Login (`/login`)

**File:** `src/app/(auth)/login/page.js`

- Google OAuth button
- Menggunakan `@auth/core` Google Provider
- Flow: Click → Google popup → Get ID token → POST `/api/sso/google-login` → Store JWT → Redirect
- Auto-create member jika baru
- Redirect ke `/profil/edit` jika profil belum lengkap

### 2.3 Register (`/register`)

**File:** `src/app/(auth)/register/page.js`

- Form: nama lengkap, nomor WA, social media
- Submit ke `/api/profil` (POST)
- Redirect ke dashboard setelah selesai

### 2.4 Task List (`/tugas`)

**File:** `src/app/(main)/tugas/page.js`

- List tugas yang tersedia (dari `/api/tugas`)
- Filter: semua / tersedia / dikerjakan / selesai
- Setiap card menampilkan: keyword, deskripsi, poin, status member
- Klik → navigasi ke `/tugas/[id]`

### 2.5 Task Detail (`/tugas/[id]`)

**File:** `src/app/(main)/tugas/[id]/page.js`

- Detail tugas: keyword, deskripsi, link postingan, poin
- Button "Kerjakan Tugas" → POST create submission
- Timer countdown jika ada batas waktu
- Status: belum dikerjakan / sedang dikerjakan / selesai / gagal
- Link ke post Instagram/Facebook yang harus dikomentari

### 2.6 Screenshot Task (`/tugas-ss/[id]`)

**File:** `src/app/(main)/tugas-ss/[id]/page.js`

- Detail tugas screenshot (tugas_ai_2)
- Upload form screenshot (drag & drop / click)
- Preview gambar sebelum upload
- Input link komentar (optional)
- Status verifikasi screenshot
- Upload ke MinIO via `/api/tugas/[id]/screenshot`

### 2.7 Ranking/Leaderboard (`/ranking`)

**File:** `src/app/(main)/ranking/page.js`

- Leaderboard loyalty point (Top members)
- Leaderboard komentar (Top commenters)
- Infinite scroll (`/api/leaderboard/infinite`)
- Tampilan: foto profil, nama, poin, ranking badge
- Member bisa melihat ranking mereka sendiri

### 2.8 Dashboard (`/dashboard`)

**File:** `src/app/(main)/dashboard/page.js`

- Statistik personal: loyalty point, coin, level, progress
- Task stats: total dikerjakan, selesai, gagal
- Recent notifications
- Chart growth (menggunakan Recharts)
- Data dari `/api/profil/dashboard`

### 2.9 Community (`/komunitas`)

**File:** `src/app/(main)/komunitas/page.js`

- List member komunitas
- Search member
- Card: foto, nama, level badge, poin
- Klik → profil publik

### 2.10 Rewards (`/rewards`)

**File:** `src/app/(main)/rewards/page.js`

- Catalog reward yang tersedia
- Filter by kategori
- Card: foto, nama, harga coin, stok
- Button "Tukar" → modal konfirmasi
- BerkomunitasPlus exclusive rewards ditandai badge

### 2.11 Profile (`/profil`)

**File:** `src/app/(main)/profil/page.js`

- Profil diri sendiri
- Info: nama, bio, status, foto, level, badge
- Social media links
- Task statistics
- Coin & loyalty point balance
- Wall posts
- Tombol edit profil

### 2.12 Profile Edit (`/profil/edit`)

**File:** `src/app/(main)/profil/edit/page.js`

- Form edit: nama, bio, status, foto, nomor WA
- Upload foto profil (drag & drop)
- Manage social media (add/remove)
- Set username custom
- Save → PUT `/api/profil`

### 2.13 Public Profile (`/profil/[username]`)

**File:** `src/app/(main)/profil/[username]/page.js`

- Profil publik member lain
- Info: nama, bio, level, badge, social media
- Wall posts (bisa post jika login)
- Data dari `/api/profil/[username]`

---

## 3. Halaman Admin Panel

**Subdomain:** `admin.berkomunitas.com`
**Internal path:** `/admin-app/*`

### 3.1 Admin Login (`/admin-app/login`)

- Google OAuth login (sama seperti user login)
- Setelah login → check admin privilege via `/api/admin/check`
- Redirect ke `/admin-app/panel` jika admin
- Error page jika bukan admin

### 3.2 Admin Dashboard (`/admin-app/panel`)

- Global statistics: total member, komentar, tugas, hadiah
- Chart: komentar harian, loyalty harian (30 hari)
- Top 10 leaderboard (komentar & loyalty)
- Tugas terpopuler
- Sumber tugas terpopuler
- Data dari `/api/admin/dashboard`

### 3.3 Member Management (`/admin-app/panel/member`)

- Tabel semua member dengan pagination
- Search by nama / email
- Kolom: ID, nama, email, WA, login terakhir, poin, coin, level
- Actions: view detail, edit, delete
- CRUD via `/api/admin/members`

### 3.4 Task Management — Comment (`/admin-app/panel/tugas`)

- Tabel tugas komentar (tugas_ai)
- CRUD: buat baru, edit, hapus, ubah status
- Kolom: ID, keyword, deskripsi, link, poin, status, jumlah submission
- Via `/api/admin/tugas`

### 3.5 Task Management — Screenshot (`/admin-app/panel/tugas-ss`)

- Tabel tugas screenshot (tugas_ai_2)
- CRUD dengan field tambahan: source, verification_rules
- Preview screenshot yang diupload member
- Via `/api/admin/tugas-ai-2`

### 3.6 Submissions Review (`/admin-app/panel/submissions`)

- Tabel semua task submissions
- Filter: status (pending, selesai, gagal)
- Review: lihat detail, approve (+poin), reject
- Screenshot viewer untuk tugas_ai_2
- Via `/api/admin/task-submissions/[id]`

### 3.7 Rewards Management (`/admin-app/panel/rewards`)

- CRUD rewards: nama, deskripsi, harga, stok, kategori, foto
- Upload foto reward
- Toggle aktif/nonaktif
- Set privilege requirement
- Via `/api/admin/rewards`

### 3.8 Redemptions (`/admin-app/panel/redemptions`)

- List semua penukaran reward
- Status: menunggu_verifikasi → diproses → dikirim → diterima
- Update status + catatan pengiriman
- Via `/api/admin/redemptions`

### 3.9 Badges Management (`/admin-app/panel/badges`)

- CRUD badges: nama, deskripsi, warna, style
- Assign badge ke member (individual / batch)
- Via `/api/admin/badges` + `/api/admin/member-badges`

### 3.10 Points Management (`/admin-app/panel/points`)

- Riwayat loyalty point semua member
- Manual add/correction
- Filter by member, event type, date range
- Via `/api/admin/points`

### 3.11 Coins Management (`/admin-app/panel/coins`)

- Riwayat coin semua member
- Manual add
- Filter similar to points
- Via `/api/admin/coins`

### 3.12 Levels Management (`/admin-app/panel/levels`)

- CRUD level definitions
- Via `/api/admin/levels`

### 3.13 Events Management (`/admin-app/panel/events`)

- CRUD event settings (banner, promos, etc.)
- Set start/end date
- Via `/api/admin/events`

### 3.14 Statistics (`/admin-app/panel/stats`)

- ⚠️ Menggunakan mock data (belum implement)
- Overview dan member growth charts

---

## 4. Halaman Rewards App

**Subdomain:** `rewards.berkomunitas.com`
**Internal path:** `/rewards-app/*`

### 4.1 Reward Catalog (`/rewards-app/`)

- Grid reward tersedia
- Filter by kategori
- Exclusive rewards (perlu BerkomunitasPlus) ditandai
- Click → modal detail + button redeem
- Via `/api/rewards-by-category`

### 4.2 Redemption History (`/rewards-app/riwayat`)

- List riwayat penukaran user
- Status tracking: menunggu → diproses → dikirim → diterima
- Konfirmasi penerimaan
- Via `/api/profil/rewards-history`

---

## 5. UI Components Library

### 5.1 Base UI Components (shadcn/ui style)

Lokasi: `src/components/ui/`

| Component | File | Deskripsi |
|-----------|------|-----------|
| `Button` | `button.jsx` | Button variants: default, destructive, outline, secondary, ghost, link. Sizes: default, sm, lg, icon |
| `Card` | `card.jsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| `Dialog` | `dialog.jsx` | Modal dialog (Radix UI) |
| `Input` | `input.jsx` | Text input |
| `Select` | `select.jsx` | Dropdown select (Radix UI) |
| `Badge` | `badge.jsx` | Status badge with variants |
| `Progress` | `progress.jsx` | Progress bar |
| `Skeleton` | `skeleton.jsx` | Loading skeleton |
| `Tabs` | `tabs.jsx` | Tab navigation (Radix UI) |
| `Tooltip` | `tooltip.jsx` | Hover tooltip (Radix UI) |
| `Command` | `command.jsx` | Command palette (cmdk) |
| `Carousel` | `carousel.jsx` | Image carousel (Embla) |
| `Popover` | `popover.jsx` | Popover menu (Radix UI) |
| `DropdownMenu` | `dropdown-menu.jsx` | Dropdown menu (Radix UI) |
| `Table` | `table.jsx` | Data table |
| `Textarea` | `textarea.jsx` | Multi-line input |
| `Label` | `label.jsx` | Form label |
| `Switch` | `switch.jsx` | Toggle switch |
| `Avatar` | `avatar.jsx` | User avatar |
| `Separator` | `separator.jsx` | Visual separator |
| `ScrollArea` | `scroll-area.jsx` | Scrollable container |
| `Sheet` | `sheet.jsx` | Slide-over panel |
| `Sidebar` | `sidebar.jsx` | Navigation sidebar |
| `Collapsible` | `collapsible.jsx` | Collapsible section |

Semua component menggunakan CVA (class-variance-authority) + `cn()` utility untuk conditional classes.

### 5.2 Custom Components

| Component | Deskripsi | Props |
|-----------|-----------|-------|
| `GlassThemeProvider` | Theme provider (dark/light + glass effect) | `children` |
| `SubdomainHandler` | Detects current subdomain, provides context | `children` |
| `NavigationWrapper` | Responsive navbar with mobile drawer | `children` |
| `ContentWrapper` | Main content area with padding | `children` |
| `AutoGlassWrapper` | Applies glass morphism background | `children` |
| `RankBadge` | Ranking level badge display | `level, points, size` |
| `UserAvatar` | User avatar with fallback (DiceBear/initials) | `user, size, className` |
| `NotificationBell` | Notification icon with unread count | - |
| `TaskCard` | Task card for listing | `task, onAction` |
| `RewardCard` | Reward card for catalog | `reward, onRedeem` |
| `LeaderboardRow` | Single leaderboard entry | `member, rank` |
| `PointsDisplay` | Coin + loyalty display widget | `coin, loyalty` |
| `LevelProgress` | Level progress bar with next level info | `currentPoints` |
| `LoadingSpinner` | Loading indicator | `size` |
| `EmptyState` | Empty state illustration + message | `title, description, action` |

---

## 6. Custom React Hooks

### 6.1 `useAuth()` — Authentication Hook ⭐

**File:** `src/hooks/useAuth.js`

```javascript
const { user, loading, login, logout, isAuthenticated } = useAuth();
```

| Return | Type | Deskripsi |
|--------|------|-----------|
| `user` | `object \| null` | Current user data |
| `loading` | `boolean` | Loading state |
| `login` | `function` | Trigger Google OAuth login |
| `logout` | `function` | Logout + clear tokens |
| `isAuthenticated` | `boolean` | Login status |

**Cara kerja:**
1. On mount → read `access_token` dari localStorage
2. Verify via `/api/sso/verify-token`
3. If expired → try refresh via `/api/sso/refresh-token`
4. If both fail → set user = null

### 6.2 `useAdmin()` — Admin Check Hook

**File:** `src/hooks/useAdmin.js`

```javascript
const { isAdmin, loading, user } = useAdmin();
```

| Return | Type | Deskripsi |
|--------|------|-----------|
| `isAdmin` | `boolean` | Has admin privilege |
| `loading` | `boolean` | Loading state |
| `user` | `object \| null` | User data |

Checks via `/api/admin/check`.

### 6.3 `useNotifCount()` — Notification Counter

**File:** `src/hooks/useNotifCount.js`

```javascript
const { count, markAsRead, refresh } = useNotifCount();
```

Polls `/api/notifikasi` for unread count.

### 6.4 `useDashboard()` — Dashboard Data

**File:** `src/hooks/useDashboard.js`

```javascript
const { data, loading, error, refresh } = useDashboard();
```

Fetches `/api/profil/dashboard`. Returns: loyalty, coin, level, task stats, recent activity.

### 6.5 `useMounted()` — Client Mount Check

**File:** `src/hooks/useMounted.js`

```javascript
const mounted = useMounted(); // true setelah component mount di client
```

Berguna untuk menghindari hydration mismatch.

### 6.6 `useDebounce()` — Input Debouncing  

**File:** `src/hooks/useDebounce.js`

```javascript
const debouncedValue = useDebounce(value, delay);
```

### 6.7 `use-mobile` — Mobile Detection

**File:** `src/hooks/use-mobile.js`

```javascript
const isMobile = useMobile(); // true jika viewport < 768px
```

### 6.8 `use-toast` — Toast Notifications

**File:** `src/hooks/use-toast.js`

```javascript
const { toast } = useToast();
toast({ title: "Success", description: "Berhasil disimpan" });
```

---

## 7. Utility Functions

### 7.1 `cn()` — Class Name Merger

**File:** `src/utils/cn.js`

```javascript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

Gabung class names + resolve Tailwind conflicts.

### 7.2 `hierarchicalPrivilegeChecker.js`

**File:** `src/utils/hierarchicalPrivilegeChecker.js`

```javascript
// Privilege hierarchy: super_admin > admin > BerkomunitasPlus > member
export function hasPrivilege(userPrivileges, requiredPrivilege)
export function getHighestPrivilege(userPrivileges)
```

**⚠️ BUG:** File ini missing import untuk Prisma (jika dipanggil di server).

---

## 8. n8n Workflow Integration

### Overview

n8n adalah platform workflow automation self-hosted yang digunakan Berkomunitas untuk:
1. **Scraping komentar** dari Instagram, Facebook, TikTok
2. **Verifikasi tugas** (matching komentar dengan member)
3. **AI verification** screenshot tugas
4. **Auto task creation** dari konten media sosial

### 8.1 Instagram Comment Scraping Workflow

```
Trigger: Schedule (every X hours)
    │
    ▼
┌─────────────────────┐
│ 1. Fetch IG Accounts │ ← Query instagram_accounts table
│    (active, by       │
│    priority)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. For each account: │
│    Fetch posts via   │ ← Instagram Graph API
│    IG Business API   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. For each post:    │
│    Fetch comments    │ ← Instagram Graph API
│    + replies         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Upsert comments  │ ← INSERT into comments table
│    to database       │    (on conflict: update)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. Update media      │ ← UPDATE media table
│    table (posts)     │    with latest stats
└──────────────────────┘
```

**Tables affected:** `instagram_accounts`, `media`, `comments`

### 8.2 Facebook Comment Scraping Workflow

```
Trigger: Schedule (every X hours)
    │
    ▼
┌─────────────────────────┐
│ 1. Fetch FB Pages       │ ← Query facebook_pages table
│    (active, by priority)│
└──────────┬──────────────┘
           │
           ▼
┌──────────────────────────┐
│ 2. For each page:        │
│    Fetch posts via       │ ← Facebook Graph API
│    FB Page API           │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 3. For each post:        │
│    Fetch all comments    │ ← Facebook Graph API (paginated)
│    + reactions           │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 4. Upsert to database    │ ← facebook_posts, facebook_comments
│                          │
│ 5. Log execution         │ ← facebook_execution_log
└──────────────────────────┘
```

**Tables affected:** `facebook_pages`, `facebook_posts`, `facebook_comments`, `facebook_execution_log`

### 8.3 Task Verification Workflow (Comment Matching)

```
Trigger: Webhook / Schedule
    │
    ▼
┌──────────────────────────┐
│ 1. Fetch pending          │ ← task_submissions WHERE 
│    submissions            │    status = 'dikerjakan'
│    with scheduled_check   │    AND scheduled_check_at ≤ NOW()
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 2. For each submission:   │
│    Find matching comment  │ ← Query comments table
│    by member's username   │    WHERE username matches
│    + task's post          │    member's social media
│    + keyword presence     │    + keyword in comment text
└──────────┬───────────────┘
           │
     ┌─────┴─────┐
     │           │
  FOUND      NOT FOUND
     │           │
     ▼           ▼
┌──────────┐ ┌──────────────┐
│ Mark as  │ │ Increment    │
│ 'selesai'│ │ attempt      │
│ +points  │ │ count        │
│ +notif   │ │ Retry later  │
└──────────┘ │ or mark      │
             │ 'gagal'      │
             └──────────────┘
```

**Tables affected:** `task_submissions`, `comments`, `members`, `coin_history`, `loyalty_point_history`, `notifications`

### 8.4 Screenshot AI Verification Workflow ⭐ PRODUCTION

**Trigger:** `POST N8N_SCREENSHOT_VERIFICATION_WEBHOOK` fired by app after screenshot upload.  
**Callback:** n8n calls `POST /api/n8n/screenshot-callback` with result.

```
App → fires webhook (fire-and-forget)
    │    { screenshotId, submissionId, taskId, memberId,
    │      platform, screenshotUrl, commentLink, keyword,
    │      verificationRules, callbackUrl }
    │
n8n receives ──▶
    │
    ▼
┌──────────────────────────┐
│ 1. Download screenshot   │ ← screenshotUrl (MinIO)
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ 2. AI Analysis           │ ← OpenAI Vision / OCR
│    • Extract text        │    verificationRules.keyword
│    • Check platform      │    verificationRules.min_confidence
│    • Confidence score    │
└──────────┬───────────────┘
     ┌─────┴─────┐
  VERIFIED    FAILED
     │           │
     └─────┬─────┘
           ▼
┌──────────────────────────────────────────────┐
│ 3. POST callbackUrl (/api/n8n/               │
│    screenshot-callback)                      │
│    header: x-n8n-secret: <N8N_WEBHOOK_SECRET>│
│    { screenshotId, submissionId,             │
│      status: 'selesai'|'gagal',              │
│      ai_confidence, ai_text, n8n_execution_id}│
└──────────┬───────────────────────────────────┘
           │
           ▼ App processes callback
┌──────────────────────────┐
│ If selesai:              │
│  • screenshots.status    │ = 'selesai'
│  • submissions.status    │ = 'selesai'
│  • member_stats +points  │
│  • coin_transactions++   │
│ If gagal:                │
│  • screenshots.status    │ = 'gagal_diverifikasi'
│  • submissions.status    │ = 'gagal'
│  • verification_attempts │ += 1
└──────────────────────────┘
```

**Tables affected:** `tugas_ai_2_screenshots`, `tugas_ai_2_submissions`, `member_stats`, `coin_transactions`

**Environment Variables:**
```
N8N_SCREENSHOT_VERIFICATION_WEBHOOK = https://n8n.drwapp.com/webhook/screenshot-verification
N8N_WEBHOOK_SECRET = berkomunitas-n8n-2025
```

### 8.5 AI Task Generation Workflow

```
Trigger: New media in media table (ai_status = null)
    │
    ▼
┌──────────────────────────┐
│ 1. Fetch unprocessed     │ ← media WHERE ai_status IS NULL
│    media posts           │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 2. AI Analysis:          │
│    • Analyze caption     │ ← OpenAI / custom model
│    • Generate task       │
│      recommendation      │
│    • Extract keyword     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 3. Update media table    │ ← rekomendasi_task, rekomendasi_keyword
│    + Create tugas_ai     │    ai_status = 'processed'
│    record                │
└──────────────────────────┘
```

### 8.6 Facebook Auto-Comment Workflow

```
Trigger: facebook_trigger_comment_queue (status = 'pending')
    │
    ▼
┌──────────────────────────┐
│ 1. Post comments on      │ ← Facebook Graph API
│    target post            │    (2 comments per post)
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 2. Update queue record   │ ← posted_comment_id_1,
│                          │    posted_comment_id_2,
│                          │    status = 'done'
└──────────────────────────┘
```

### 8.7 TikTok Content Scraping → Auto-Task Creation ⭐ PRODUCTION

Full end-to-end workflow dari scraping TikTok sampai task tersedia di dashboard member.

```
Trigger: Schedule (cron, mis. setiap 4 jam)
    │
    ▼
┌──────────────────────────┐
│ 1. Scrape TikTok content │ ← Third-party scraping service
│    for @drwskincare      │    (tidak ada official API)
└──────────┬───────────────┘
           │ content_id, author_username, video_url, description, counts
           ▼
┌──────────────────────────┐
│ 2. POST /api/n8n/        │ ← app endpoint (idempotent)
│    tiktok-to-tugas       │    header: x-n8n-secret
│                          │    upserts tiktok_contents
│                          │    creates tugas_ai_2 (if new)
└──────────┬───────────────┘
     ┌─────┴─────┐
  CREATED    EXISTING
     │         │ (skip — task sudah ada)
     ▼
┌──────────────────────────┐
│ 3. Task tersedia di      │ ← source = 'tiktok', filter 🎵 TikTok
│    dashboard member      │
└──────────┬───────────────┘
           │  Member klik "Kerjakan"
           ▼
┌──────────────────────────┐
│ 4. POST /api/tugas-ai-2/ │ ← creates tugas_ai_2_submissions
│    [id]/kerjakan         │    batas_waktu = now() + 24h
└──────────┬───────────────┘
           │  Member upload screenshot
           ▼
┌──────────────────────────┐
│ 5. POST /api/tugas/      │ ← MinIO upload + fires n8n webhook
│    [id]/screenshot       │    N8N_SCREENSHOT_VERIFICATION_WEBHOOK
└──────────┬───────────────┘
           │  n8n AI verifies
           ▼
┌──────────────────────────┐
│ 6. POST /api/n8n/        │ ← n8n callback with AI result
│    screenshot-callback   │    updates status, awards points
└──────────────────────────┘
```

**n8n Workflow Setup (Step 2 — TikTok → Tugas):**
1. Trigger: Schedule (`0 */4 * * *`)
2. HTTP Request: Scraping service → returns array of videos
3. Loop: for each video
4. HTTP Request: `POST https://berkomunitas.com/api/n8n/tiktok-to-tugas`
   - Header: `x-n8n-secret: <N8N_WEBHOOK_SECRET>`
   - Body: `{ content_id, author_username, video_url, description, like_count, ... }`
5. IF `$json.data.created === true` → log or send notification

**n8n Workflow Setup (Step 6 — AI Screenshot Verification):**
1. Trigger: Webhook (receives payload from app after screenshot upload)
2. Download screenshot from `screenshotUrl`
3. OpenAI Vision: extract text, verify keyword, calculate confidence
4. IF confidence ≥ 70%: status = 'selesai' ELSE status = 'gagal'
5. HTTP Request: `POST {{ $json.callbackUrl }}` (= `/api/n8n/screenshot-callback`)
   - Header: `x-n8n-secret: <N8N_WEBHOOK_SECRET>`
   - Body: `{ screenshotId, submissionId, status, ai_confidence, ai_text, n8n_execution_id }`

### n8n Connection Points

| Tabel | Column | Purpose |
|-------|--------|---------|
| `tugas_ai_2_screenshots` | `n8n_webhook_id` | Track which webhook triggered verification |
| `tugas_ai_2_screenshots` | `n8n_execution_id` | Track n8n execution for debugging |
| `tugas_ai_2_screenshots` | `processing_started_at` | When n8n started processing |
| `tugas_ai_2_screenshots` | `processing_completed_at` | When n8n finished |
| `tugas_ai_2_submissions` | `status` | Source of truth updated by screenshot-callback |
| `tugas_ai_2_submissions` | `waktu_selesai` | Set when approved |
| `tugas_ai_2` | `tiktok_content_id` | FK traceability: which TikTok video |
| `tiktok_contents` | `content_id` | Unique TikTok video ID (idempotency key) |
| `task_submissions` | `scheduled_check_at` | When n8n should check for comments (Gen 1) |
| `facebook_execution_log` | `execution_id` | n8n execution tracking |
| `media` | `ai_status` | Track AI processing status |

### n8n Environment Variables

```bash
# App → n8n:
N8N_TASK_START_WEBHOOK_URL="https://n8n.drwapp.com/webhook/..."
N8N_SCREENSHOT_VERIFICATION_WEBHOOK="https://n8n.drwapp.com/webhook/screenshot-verification"

# n8n → App (all /api/n8n/* endpoints):
N8N_WEBHOOK_SECRET="berkomunitas-n8n-2025"   # header: x-n8n-secret

# App public URL in callback payloads:
NEXT_PUBLIC_APP_URL="https://berkomunitas.com"
```

---

## 9. Deployment & Infrastructure

### 9.1 Vercel Deployment

**Platform:** Vercel  
**Framework:** Next.js (auto-detected)  
**Build:** `next build`  
**Runtime:** Node.js (serverless functions)

**Deployment Settings (vercel.json):**
```json
{
  "functions": {
    "src/app/api/**/*.js": { "maxDuration": 30 }
  }
}
```

**Domain Setup:**
```
berkomunitas.com          → Vercel project (main)
admin.berkomunitas.com    → Same Vercel project (subdomain)
rewards.berkomunitas.com  → Same Vercel project (subdomain)
```

Subdomain routing ditangani oleh:
1. Vercel rewrites (vercel.json) 
2. Root middleware.js (redundant, keduanya melakukan hal sama)

### 9.2 Environment Variables di Vercel

Set semua environment variables ini di Vercel Dashboard → Project Settings → Environment Variables:

```
DATABASE_URL              → Semua environments
JWT_SECRET                → Semua environments
GOOGLE_CLIENT_ID          → Semua environments
GOOGLE_CLIENT_SECRET      → Semua environments
NEXT_PUBLIC_SSO_API_URL   → Semua environments
MINIO_ENDPOINT            → Semua environments
MINIO_ACCESS_KEY          → Semua environments
MINIO_SECRET_KEY          → Semua environments
MINIO_BUCKET              → Semua environments
MINIO_REGION              → Semua environments
MINIO_USE_SSL             → Semua environments
MINIO_PUBLIC_URL          → Semua environments
CLOUDINARY_CLOUD_NAME     → Production (legacy)
CLOUDINARY_API_KEY        → Production (legacy)
CLOUDINARY_API_SECRET     → Production (legacy)
VPS_UPLOAD_URL            → Production (fallback)
VPS_UPLOAD_SECRET         → Production (fallback)
DRW_API_URL               → Production
DRW_API_KEY               → Production
```

### 9.3 Database Setup

1. Provision PostgreSQL database (Supabase / Neon / self-hosted)
2. Set `DATABASE_URL` dengan `connection_limit=2` 
3. Run Prisma:
```bash
npx prisma generate        # Generate client
npx prisma db push         # Push schema (tanpa migration history)
# atau
npx prisma migrate deploy  # Apply migrations
```

### 9.4 MinIO Storage Setup

1. Install MinIO di VPS
2. Create bucket: `berkomunitas`
3. Set bucket policy ke public read:
```bash
mc anonymous set download myminio/berkomunitas
```
4. Setup HTTPS (nginx reverse proxy + Let's Encrypt)
5. Set env vars: MINIO_ENDPOINT, MINIO_ACCESS_KEY, dll

### 9.5 n8n Setup

1. Install n8n (self-hosted atau cloud)
2. Configure database connection (same PostgreSQL)
3. Import workflow JSONs
4. Set credentials: Instagram API, Facebook API, OpenAI
5. Set webhook URLs di Berkomunitas app
6. Enable scheduled triggers

### 9.6 Build & Deploy Commands

```bash
# Local Development
npm install
npx prisma generate
npm run dev                 # http://localhost:3000

# Production Build
npm run build
npm start

# Prisma Commands
npx prisma studio           # Visual DB editor (http://localhost:5555)
npx prisma db push           # Push schema changes
npx prisma migrate dev       # Create migration
npx prisma migrate deploy    # Apply migrations
npx prisma generate          # Regenerate client
```

---

## 10. Scripts & Maintenance Tools

Lokasi: `scripts/` (60+ files)

### Analysis Scripts

| Script | Deskripsi |
|--------|-----------|
| `analyze-comment-points.js` | Analyze point distribution from comments |
| `analyze-comment-points-impact.sql` | SQL analysis of comment points impact |
| `analyze-drwcorp-employees.js` | Analyze DRW Corp employee data |
| `analyze-other-profile-urls.py` | Check profile URLs format |

### Check/Status Scripts

| Script | Deskripsi |
|--------|-----------|
| `check-admin-access.sql` | Verify admin privileges in DB |
| `check-cascade-status.py` | Verify cascade delete is working |
| `check-deployment.js` | Test deployment health |
| `check-email-status.js` | Check member email status |
| `check-minio-bucket.py` | Test MinIO bucket access |
| `check-minio-migration-status.py` | Migration progress check |
| `check-orphaned-data.py` | Find orphaned records |
| `check-photo-status.js` | Check profile photo URLs |
| `check-schema.py` | Validate Prisma schema |

### Fix/Migration Scripts

| Script | Deskripsi |
|--------|-----------|
| `fix-env.py` | Fix environment variables formatting |
| `migrate-cloudinary-to-minio.js` | Migrate photos from Cloudinary to MinIO |
| `migrate-existing-members.js` | Migrate old member data |
| `sync-coin-loyalty.js` | Fix coin/loyalty discrepancies |
| `aggressive-reindex.js` | Reindex database for performance |

### Utility Scripts

| Script | Deskripsi |
|--------|-----------|
| `bulk-fix-clerk-auth.py` | Batch fix Clerk → SSO auth |
| `bulk-fix-frontend-clerk.py` | Remove Clerk references from frontend |

---

## 11. Known Issues & Technical Debt

### 🔴 Critical

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | SSO middleware INAKTIF | Protected routes accessible tanpa login | Merge src/middleware.js ke root middleware.js |
| 2 | JWT_SECRET logged to console | Security risk di production | Hapus console.log di lib/ssoAuth.js |
| 3 | Duplicate Prisma clients | 4 DB connections instead of 2 | Merge ke satu instance |
| 4 | No auth di beberapa admin endpoints | Data manipulation tanpa auth | Add requireAdmin() |

### 🟡 Medium

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 5 | DRW Corp endpoints tanpa auth | Employee data exposed | Add auth |
| 6 | Debug endpoints di production | Internal data exposed | Conditional disable |
| 7 | Inconsistent response format | Confusing untuk frontend | Standardize response wrapper |
| 8 | facebook_task_submissions no FK | Orphaned data risk | Add foreign keys |
| 9 | Mock data di admin stats | Stats halaman tidak akurat | Implement real queries |
| 10 | x-user-email auth pattern | Easily spoofed | Migrate to getCurrentUser() |

### 🟢 Low / Cleanup

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 11 | Clerk leftovers (domains, clerk_id, webhook) | Confusion | Remove all Clerk references |
| 12 | `apiClient.js` undeclared memberId | Bug jika used | Fix or deprecate |
| 13 | SocialLink model no FK | Orphan | Add FK or remove |
| 14 | `exhaustive-deps` ESLint off | Potential stale closures | Turn on gradually |
| 15 | Image optimization disabled | Bandwidth waste | Enable selectively |

---

## 12. Panduan untuk AI Agent / Copilot

### Quick Reference: "Dimana saya harus edit?"

| Ingin menambah... | File yang harus diedit |
|-------------------|----------------------|
| **API endpoint baru** | `src/app/api/[path]/route.js` (create new) |
| **Halaman baru** | `src/app/(main)/[path]/page.js` (create new) |
| **Admin halaman baru** | `src/app/admin-app/panel/[path]/page.js` (create new) |
| **Tabel database baru** | `prisma/schema.prisma` → `npx prisma db push` |
| **Library baru** | `lib/[name].js` (create new) |
| **Component UI baru** | `src/components/[Name].jsx` (create new) |
| **Hook baru** | `src/hooks/use[Name].js` (create new) |
| **Environment variable** | `.env` + Vercel Dashboard |

### Import Cheatsheet

```javascript
// Database
import prisma from '@/lib/prisma';

// Auth
import { getCurrentUser } from '@/lib/ssoAuth';
import { requireAdmin } from '@/lib/requireAdmin';

// Storage
import { uploadFile, uploadToMinIO, deleteFromMinIO } from '@/lib/storage';

// Points
import { addPoints, spendCoins, fixSync } from '@/lib/coinLoyaltyManager';

// Ranking
import { findUserLevel, getNextLevel, RANKING_LEVELS } from '@/lib/rankingLevels';

// Notifications
import { notifyTaskCompleted, notifyTaskFailed } from '@/lib/taskNotifications';
import { notifyRewardRedeemed, notifyRewardShipped } from '@/lib/rewardNotifications';

// Utils
import { cn } from '@/utils/cn';
import { convertBigInt } from '@/lib/bigIntUtils';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
```

### Pola Umum yang Digunakan

**1. API Route Pattern:**
```javascript
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    
    const data = await prisma.someTable.findMany({ where: { member_id: user.id } });
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**2. Page Component Pattern:**
```jsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function MyPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user) {
      fetch('/api/some-endpoint', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      })
        .then(res => res.json())
        .then(setData);
    }
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">My Page</h1>
      {/* content */}
    </div>
  );
}
```

**3. Admin Page Pattern:**
```jsx
'use client';
import { useAdmin } from '@/hooks/useAdmin';

export default function AdminPage() {
  const { isAdmin, loading } = useAdmin();

  if (loading) return <div>Checking admin access...</div>;
  if (!isAdmin) return <div>Admin access required</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Page</h1>
      {/* admin content */}
    </div>
  );
}
```

### Do's and Don'ts

**✅ DO:**
- Gunakan `@/lib/prisma` (singleton) untuk semua database queries
- Gunakan `getCurrentUser(request)` untuk auth di API routes
- Gunakan `@/` path aliases untuk imports
- Tambahkan try/catch di setiap API route
- Buat notification saat action penting (task complete, redeem, dll)
- Update `coin_history` dan `loyalty_point_history` setiap kali ubah poin
- Gunakan `CoinLoyaltyManager` untuk operasi poin (atomic + auto-sync)

**❌ DON'T:**
- JANGAN import dari `lib/prisma-with-sync-middleware.js` (buat instance Prisma baru)
- JANGAN manipulasi `coin` dan `loyalty_point` langsung tanpa history
- JANGAN buat endpoint tanpa auth kecuali memang public
- JANGAN console.log secret/token di production
- JANGAN gunakan `x-user-email` header untuk auth (use getCurrentUser)
- JANGAN tambahkan Clerk-related code (fully migrated to SSO)
- JANGAN lupa `await params` di dynamic route (Next.js 15 requirement)

### Database Conventions

- **Table names:** Snake_case, Indonesian (`tugas_ai`, `member_badges`)
- **Column names:** Snake_case, Indonesian (`nama_lengkap`, `nomer_wa`, `waktu_klik`)
- **Foreign key convention:** `id_member`, `id_task`, `member_id` (inconsistent — check schema)
- **Status values:** Indonesian (`tersedia`, `dikerjakan`, `selesai`, `gagal`, `menunggu_verifikasi`)
- **Default timestamps:** `created_at`, `updated_at` with `@default(now())`
- **Soft delete:** NOT used (hard delete with CASCADE)
- **Cascade:** Most FK use `onDelete: Cascade`, some use `NoAction` or `SetNull`

### File Naming Conventions

| Type | Convention | Contoh |
|------|-----------|--------|
| API Route | `route.js` in directory | `src/app/api/tugas/route.js` |
| Page | `page.js` in directory | `src/app/(main)/tugas/page.js` |
| Layout | `layout.js` | `src/app/layout.js` |
| Component | PascalCase.jsx | `src/components/TaskCard.jsx` |
| UI Component | lowercase.jsx | `src/components/ui/button.jsx` |
| Hook | camelCase.js | `src/hooks/useAuth.js` |
| Library | camelCase.js | `lib/coinLoyaltyManager.js` |
| Utility | camelCase.js | `src/utils/cn.js` |

---

> **📌 Ringkasan 4 Dokumen:**
> - [DOCS_1_FOUNDATION.md](DOCS_1_FOUNDATION.md) — Overview, tech stack, architecture, configs, middleware, theming
> - [DOCS_2_DATABASE.md](DOCS_2_DATABASE.md) — 52 tables detail, relationships, indexes, business rules
> - [DOCS_3_API_BACKEND.md](DOCS_3_API_BACKEND.md) — 117 API endpoints, lib functions, coding templates
> - **DOCS_4_FRONTEND_N8N_DEPLOY.md** (dokumen ini) — Frontend pages, components, hooks, n8n, deployment, AI guide
