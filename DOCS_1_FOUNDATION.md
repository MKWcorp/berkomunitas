# 📘 DOKUMENTASI 1: FONDASI & ARSITEKTUR PROYEK

## Berkomunitas — Platform Komunitas DRW Group

> Dokumen ini menjelaskan fondasi teknis proyek secara menyeluruh: overview, tech stack, arsitektur, folder structure, konfigurasi, middleware, theming, dan environment variables.

---

## Daftar Isi

1. [Overview Proyek](#1-overview-proyek)
2. [Tech Stack Lengkap](#2-tech-stack-lengkap)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Folder Structure Detail](#4-folder-structure-detail)
5. [Konfigurasi File-by-File](#5-konfigurasi-file-by-file)
6. [Middleware Architecture](#6-middleware-architecture)
7. [Root Layout & Component Tree](#7-root-layout--component-tree)
8. [CSS & Theming System](#8-css--theming-system)
9. [Environment Variables](#9-environment-variables)
10. [Path Aliases & Import Conventions](#10-path-aliases--import-conventions)
11. [Known Issues & Technical Debt](#11-known-issues--technical-debt)

---

## 1. Overview Proyek

**Berkomunitas** adalah platform komunitas digital milik DRW Group yang bertujuan:
- Menyatukan komunitas DRW Skincare (Beauty Consultant / BC) dan DRW Corp (karyawan)
- Memberikan task/tugas (comment di Instagram/Facebook/TikTok) untuk engagement
- Memberikan reward berupa hadiah fisik/digital yang bisa ditukar dengan coin
- Membangun sistem gamifikasi dengan 19 level ranking Islami
- Menyediakan leaderboard, badge, dan profil publik untuk member

**URL Production:**
- **Main Site:** `https://berkomunitas.com` 
- **Admin Panel:** `https://admin.berkomunitas.com` (subdomain)
- **Rewards App:** `https://rewards.berkomunitas.com` (subdomain)

**Model Bisnis:**
- Member register via Google OAuth → dapat profil
- Admin membuat tugas (comment/screenshot) → member mengerjakan → dapat poin
- Poin (loyalty_point) menentukan ranking level → coin bisa ditukar reward
- n8n otomatis scrape komentar Instagram/Facebook/TikTok → verifikasi tugas

---

## 2. Tech Stack Lengkap

### Frontend

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| **Next.js** | 15.x | App Router, React Server Components, API Routes |
| **React** | 18.x | UI Library |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **Radix UI** | Latest | Headless UI primitives (Dialog, Popover, Select, dll) |
| **Lucide React** | Latest | Icon library |
| **Framer Motion** | Latest | Animasi dan transisi |
| **Recharts** | Latest | Chart/grafik di dashboard |
| **React Hot Toast** | Latest | Notifikasi toast |
| **cmdk** | Latest | Command palette (Ctrl+K) |
| **Embla Carousel** | Latest | Carousel/slider component |
| **next-themes** | Latest | Dark/light mode toggle |

### Backend

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| **Next.js API Routes** | 15.x | REST API endpoints (App Router format) |
| **Prisma** | 5.22 | ORM untuk PostgreSQL |
| **jose** | Latest | JWT verification di Edge Runtime (middleware) |
| **jsonwebtoken** | Latest | JWT sign/verify di Server Runtime (API routes) |
| **@auth/core** | Latest | Google OAuth provider |
| **bcryptjs** | Latest | Password hashing (legacy, tidak aktif digunakan) |

### Database

| Teknologi | Detail |
|-----------|--------|
| **PostgreSQL** | Primary database, hosted (Supabase/Neon/self-hosted) |
| **Prisma ORM** | 52 models/tables, binary engine |
| **Connection Pooling** | `connection_limit=2` (production), `connection_limit=10` (development) |

### Storage

| Teknologi | Kegunaan |
|-----------|----------|
| **MinIO** | Primary S3-compatible storage (profile pictures, screenshots) |
| **Cloudinary** | Legacy fallback storage |
| **VPS Upload** | Secondary fallback (direct VPS endpoint) |
| **Local** | Development only fallback |

### Infrastructure

| Teknologi | Kegunaan |
|-----------|----------|
| **Vercel** | Hosting & deployment (Next.js optimized) |
| **n8n** | External workflow automation (scraping, verification) |
| **Google OAuth** | Authentication provider |
| **DRW Skincare API** | External API untuk data Beauty Consultant |

### Package Dependencies (package.json)

```
dependencies:
  next: 15.x
  react: 18.x
  react-dom: 18.x
  @prisma/client: 5.22
  @auth/core: latest
  @aws-sdk/client-s3: latest      ← MinIO S3 client
  jose: latest                     ← JWT (Edge)
  jsonwebtoken: latest             ← JWT (Server)
  @radix-ui/*: latest              ← UI primitives
  framer-motion: latest
  recharts: latest
  lucide-react: latest
  tailwindcss: 3.x
  class-variance-authority: latest ← shadcn/ui CVA
  clsx: latest
  tailwind-merge: latest
  next-themes: latest
  embla-carousel-react: latest
  cmdk: latest
  react-hot-toast: latest
  date-fns: latest
  google-auth-library: latest
  cloudinary: latest               ← Legacy
  svix: latest                     ← Clerk webhook (legacy)
  
devDependencies:
  prisma: 5.22
  eslint: latest
  eslint-config-next: latest
  postcss: latest
  autoprefixer: latest
```

---

## 3. Arsitektur Sistem

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         USERS                                 │
│  Browser → berkomunitas.com / admin.* / rewards.*             │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              ROOT middleware.js                           │ │
│  │  • Subdomain routing:                                    │ │
│  │    admin.* → /admin-app/*                                │ │
│  │    rewards.* → /rewards-app/*                            │ │
│  │  • NO SSO auth di sini (⚠️ bug)                         │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP ROUTER                          │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │  Main Site   │  │ Admin Panel │  │   Rewards App        │ │
│  │  /src/app/   │  │ /admin-app/ │  │   /rewards-app/      │ │
│  │  • Landing   │  │ • Dashboard │  │   • Reward catalog   │ │
│  │  • Profile   │  │ • Members   │  │   • Redemption       │ │
│  │  • Tasks     │  │ • Tasks     │  │   • History          │ │
│  │  • Ranking   │  │ • Rewards   │  │   • Categories       │ │
│  │  • Dashboard │  │ • Badges    │  │                      │ │
│  └─────────────┘  │ • Points    │  └──────────────────────┘ │
│                    │ • Levels    │                            │
│                    │ • Events    │                            │
│                    └─────────────┘                            │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 API Routes (/api/*)                       │ │
│  │  • 117 endpoint total                                    │ │
│  │  • SSO auth (JWT), Admin auth, Public                    │ │
│  │  • Prisma → PostgreSQL                                   │ │
│  │  • Storage → MinIO / Cloudinary                          │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────┬──────────────────────────┬────────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────┐    ┌─────────────────────────────────┐
│    PostgreSQL DB      │    │       External Services          │
│  • 52 tables          │    │  • Google OAuth                  │
│  • Views & indexes    │    │  • MinIO S3 Storage              │
│  • Prisma managed     │    │  • Cloudinary (legacy)           │
└──────────────────────┘    │  • n8n Automation                │
                             │  • DRW Skincare API              │
                             │  • DiceBear Avatars              │
                             │  • UI Avatars                    │
                             └─────────────────────────────────┘
```

### Authentication Flow

```
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌──────────┐
│  Browser  │────▶│  Google   │────▶│  /api/sso/   │────▶│ Database │
│           │     │  OAuth    │     │  google-login │     │          │
│  1. Click │     │  2. Auth  │     │  3. Create/  │     │ 4. Store │
│  "Login"  │     │  & Token  │     │  Update User │     │ Session  │
└──────────┘     └───────────┘     └──────────────┘     └──────────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │  Return JWT   │
                                   │  access_token │ (7 hari)
                                   │  refresh_token│ (30 hari)
                                   │  + HttpOnly   │
                                   │    cookies    │
                                   └──────────────┘
```

**JWT Token Contents:**
```json
{
  "memberId": 123,
  "email": "user@example.com",
  "name": "Nama User",
  "iat": 1700000000,
  "exp": 1700604800
}
```

### Dual Currency System

```
┌─────────────────────────────────────────────────────────┐
│                    MEMBER ACCOUNT                         │
│                                                           │
│  loyalty_point (permanent)    coin (spendable)           │
│  ┌─────────────────┐         ┌─────────────────┐        │
│  │ Naik saat:       │         │ = loyalty_point  │        │
│  │ • Task selesai   │         │ (auto-sync)      │        │
│  │ • Login          │    ═══▶ │                  │        │
│  │ • Activity       │         │ Turun saat:      │        │
│  │ • Admin manual   │         │ • Redeem reward  │        │
│  │                  │         │                  │        │
│  │ TIDAK PERNAH     │         │ Invariant:       │        │
│  │ TURUN            │         │ coin ≤ loyalty   │        │
│  │                  │         │                  │        │
│  │ Determines:      │         │ Determines:      │        │
│  │ • Ranking level  │         │ • Reward buying  │        │
│  │ • Leaderboard    │         │   power          │        │
│  └─────────────────┘         └─────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### 19-Level Islamic Ranking System

```
Surga (Heaven) - Level 13-19:
  19. Surga Firdaus        (10000+ poin)
  18. Surga Na'im          (7500+ poin)
  17. Surga Ma'wa          (5500+ poin)
  16. Surga Darussalam     (4000+ poin)
  15. Surga Darul Maqamah  (3000+ poin)
  14. Surga Maqamul Amin   (2000+ poin)
  13. Surga Adn            (1500+ poin)

Dunia (Earth) - Level 7-12:
  12. Dunia Mulia     (1000+ poin)
  11. Dunia Bijaksana (750+ poin)
  10. Dunia Berani    (500+ poin)
   9. Dunia Rajin     (300+ poin)
   8. Dunia Sabar     (150+ poin)
   7. Dunia Baru      (50+ poin)

Neraka (Hell) - Level 1-6:
   6. Neraka Hutamah  (40+ poin)
   5. Neraka Sa'ir    (30+ poin)
   4. Neraka Saqar    (20+ poin)
   3. Neraka Lazha    (10+ poin)
   2. Neraka Jahim    (1+ poin)
   1. Neraka Jahannam (0 poin) ← Default level
```

---

## 4. Folder Structure Detail

```
berkomunitas/
├── prisma/
│   ├── schema.prisma              # 838 baris, 52 models
│   ├── migrations/                # Prisma migration history
│   ├── add-coin-system.sql        # Manual SQL untuk coin system
│   ├── migration-production.sql   # Production migration script
│   └── missing-columns-migration.sql
│
├── lib/                           # Shared server-side libraries
│   ├── prisma.js                  # Singleton PrismaClient
│   ├── prisma-retry.js            # Retry wrapper + exponential backoff
│   ├── prisma-with-sync-middleware.js  # Prisma + coin/loyalty sync middleware
│   ├── sso.js                     # Client-side SSO helper (216 baris)
│   ├── ssoAuth.js                 # Server-side JWT auth (102 baris)
│   ├── storage.js                 # Unified storage upload (433 baris)
│   ├── coinLoyaltyManager.js      # CoinLoyaltyManager class (211 baris)
│   ├── rankingLevels.js           # 19 Islamic levels (293 baris)
│   ├── taskNotifications.js       # 6 task notification factories
│   ├── rewardNotifications.js     # 4 reward notification factories
│   ├── adminAuth.js               # Admin auth utility
│   ├── requireAdmin.js            # Middleware admin check
│   ├── apiClient.js               # Client fetch wrapper (deprecated)
│   ├── bigIntUtils.js             # BigInt→Number JSON conversion
│   └── drwcorp-employees.js       # 53 hardcoded employee names
│
├── src/
│   ├── middleware.js               # ⚠️ INACTIF — Overridden by root middleware
│   │
│   ├── app/
│   │   ├── layout.js              # Root layout + providers
│   │   ├── template.js            # Passthrough template
│   │   ├── globals.css            # Tailwind + glass morphism CSS variables
│   │   ├── page.js                # Landing page
│   │   │
│   │   ├── (auth)/                # Auth pages
│   │   │   ├── login/page.js
│   │   │   └── register/page.js
│   │   │
│   │   ├── (main)/                # Route groups
│   │   │   ├── komunitas/page.js
│   │   │   ├── tugas/page.js      # Task list
│   │   │   ├── tugas/[id]/page.js # Task detail
│   │   │   ├── tugas-ss/[id]/page.js  # Screenshot task
│   │   │   ├── ranking/page.js
│   │   │   ├── rewards/page.js
│   │   │   ├── dashboard/page.js
│   │   │   └── profil/
│   │   │       ├── page.js        # Own profile
│   │   │       ├── edit/page.js
│   │   │       └── [username]/page.js  # Public profile
│   │   │
│   │   ├── admin-app/             # Admin panel (subdomain: admin.berkomunitas.com)
│   │   │   ├── layout.js
│   │   │   ├── page.js            # Admin redirect
│   │   │   ├── login/page.js
│   │   │   └── panel/
│   │   │       ├── page.js        # Admin dashboard
│   │   │       ├── member/page.js
│   │   │       ├── tugas/page.js
│   │   │       ├── tugas-ss/page.js
│   │   │       ├── submissions/page.js
│   │   │       ├── rewards/page.js
│   │   │       ├── redemptions/page.js
│   │   │       ├── badges/page.js
│   │   │       ├── coins/page.js
│   │   │       ├── levels/page.js
│   │   │       ├── points/page.js
│   │   │       ├── events/page.js
│   │   │       └── stats/page.js
│   │   │
│   │   ├── rewards-app/           # Rewards app (subdomain: rewards.berkomunitas.com)
│   │   │   ├── layout.js
│   │   │   ├── page.js            # Reward catalog
│   │   │   └── riwayat/page.js    # Redemption history
│   │   │
│   │   └── api/                   # 117 API routes
│   │       ├── sso/               # 7 SSO endpoints
│   │       ├── admin/             # 35 admin endpoints
│   │       ├── profil/            # 16 profile endpoints
│   │       ├── tugas/             # Task endpoints
│   │       ├── rewards/           # Reward endpoints
│   │       ├── members/           # Member endpoints
│   │       ├── leaderboard/       # Leaderboard endpoints
│   │       ├── notifikasi/        # Notification endpoints
│   │       ├── events/            # Event endpoints
│   │       ├── beauty-consultant/ # DRW integration
│   │       ├── drwcorp/           # DRW Corp endpoints
│   │       └── debug/             # Debug endpoints (remove in prod!)
│   │
│   ├── components/                # React components
│   │   ├── ui/                    # shadcn/ui base components
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── input.jsx
│   │   │   ├── select.jsx
│   │   │   ├── badge.jsx
│   │   │   ├── progress.jsx
│   │   │   ├── skeleton.jsx
│   │   │   ├── tabs.jsx
│   │   │   ├── tooltip.jsx
│   │   │   ├── command.jsx        # cmdk
│   │   │   ├── carousel.jsx       # embla
│   │   │   └── ... (20+ components)
│   │   │
│   │   ├── GlassThemeProvider.jsx # Glass morphism theme provider
│   │   ├── SubdomainHandler.jsx   # Client-side subdomain detection
│   │   ├── NavigationWrapper.jsx  # Navbar responsive
│   │   ├── ContentWrapper.jsx     # Main content padding
│   │   ├── AutoGlassWrapper.jsx   # Auto glass effect wrapper
│   │   ├── RankBadge.jsx          # Ranking badge display
│   │   ├── UserAvatar.jsx         # User avatar with fallback
│   │   └── ... (30+ components)
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.js             # SSO authentication hook
│   │   ├── useAdmin.js            # Admin privilege check
│   │   ├── useNotifCount.js       # Notification counter
│   │   ├── useDashboard.js        # Dashboard data fetcher
│   │   ├── useMounted.js          # Client-side mount check
│   │   ├── useDebounce.js         # Input debouncing
│   │   ├── use-mobile.js          # Mobile viewport detection
│   │   └── use-toast.js           # Toast notification hook
│   │
│   └── utils/                     # Client-side utilities
│       ├── cn.js                  # clsx + tailwind-merge
│       └── hierarchicalPrivilegeChecker.js  # Privilege hierarchy
│
├── scripts/                       # Maintenance & migration scripts (60+ files)
│   ├── analyze-*.js/sql/py        # Analysis scripts
│   ├── check-*.js/py              # Status check scripts
│   ├── fix-*.js/py                # Fix/repair scripts
│   ├── migrate-*.js/py            # Migration scripts
│   └── sync-*.js                  # Data sync scripts
│
├── public/
│   ├── robots.txt
│   ├── sitemap.xml
│   └── uploads/                   # Local upload storage (dev only)
│
├── middleware.js                   # ⚠️ ROOT middleware (ACTIVE — overrides src/)
├── next.config.mjs                # Next.js configuration
├── tailwind.config.js             # Tailwind + shadcn/ui theming
├── postcss.config.mjs             # PostCSS (Tailwind plugin)
├── jsconfig.json                  # Path aliases
├── eslint.config.mjs              # ESLint (relaxed rules)
├── vercel.json                    # Vercel deployment config
├── package.json                   # Dependencies
└── *.md                           # 30+ documentation files
```

---

## 5. Konfigurasi File-by-File

### 5.1 `next.config.mjs`

```javascript
const nextConfig = {
  images: {
    // Legacy Clerk domains masih ada
    domains: [
      'img.clerk.com',                  // ← CLERK LEGACY (bisa dihapus)
      'api.dicebear.com',               // ← Auto-generated avatars
      'res.cloudinary.com',             // ← Cloudinary legacy storage
    ],
    unoptimized: true,                  // Disable Next.js Image Optimization
  },
  async redirects() {
    return [{
      source: '/task',
      destination: '/tugas',            // Redirect /task → /tugas (Indonesian)
      permanent: false,
    }];
  },
};
```

**Catatan Penting:**
- `unoptimized: true` berarti semua gambar di-serve kualitas asli (berat bandwidth)
- Domain `img.clerk.com` adalah sisa migrasi dari Clerk → bisa dihapus
- Tidak ada domain MinIO di list (MinIO bypasses Next Image Optimization)

### 5.2 `vercel.json`

```json
{
  "functions": {
    "src/app/api/**/*.js": {
      "maxDuration": 30          // Semua API = max 30 detik timeout
    }
  },
  "rewrites": [
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "admin.berkomunitas.com" }],
      "destination": "/admin-app/:path*"
    },
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "rewards.berkomunitas.com" }],
      "destination": "/rewards-app/:path*"
    }
  ]
}
```

**Subdomain Routing:**
- `admin.berkomunitas.com/panel` → internal render `/admin-app/panel`
- `rewards.berkomunitas.com/` → internal render `/rewards-app/`
- `berkomunitas.com/tugas` → normal `/tugas`

### 5.3 `tailwind.config.js`

```javascript
module.exports = {
  darkMode: ["class"],                   // Dark mode via class (not media query)
  content: [
    "./src/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui CSS variable-based theming
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: { /* ... */ },
        destructive: { /* ... */ },
        muted: { /* ... */ },
        accent: { /* ... */ },
        card: { /* ... */ },
        popover: { /* ... */ },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Glass morphism custom colors
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          // ... plus accent, border, ring variants
        },
        chart: {
          1: "hsl(var(--chart-1))",
          // ... through chart-5
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
    },
  },
  plugins: [require("tailwindcss-animate")], // Tailwind animations plugin
};
```

### 5.4 `jsconfig.json` — Path Aliases

```json
{
  "compilerOptions": {
    "paths": {
      "@/*":       ["./src/*"],           // @/components/...  → ./src/components/...
      "@/lib/*":   ["./lib/*"],           // @/lib/prisma      → ./lib/prisma
      "@/utils/*": ["./src/utils/*"]      // @/utils/cn        → ./src/utils/cn
    }
  }
}
```

**⚠️ INCONSISTENCY:** Beberapa file menggunakan `../../lib/prisma` (relative) bukan `@/lib/prisma`. Harap konsisten gunakan path alias.

### 5.5 `eslint.config.mjs`

```javascript
const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "no-console": "off",              // Console.log diizinkan
      "@next/next/no-img-element": "off", // <img> tag diizinkan
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "off", // ← Dangerous: suppresses missing deps
      "react/no-unescaped-entities": "off",
      "no-unused-vars": "warn",
    },
  },
];
```

**⚠️ Resiko:** `exhaustive-deps: off` bisa menyebabkan stale closure bugs di hooks.

### 5.6 `postcss.config.mjs`

```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Standard PostCSS config — tidak ada yang custom.

---

## 6. Middleware Architecture

### ⚠️ CRITICAL: Dual Middleware Conflict

Ada **DUA file middleware** di proyek ini, tapi hanya SATU yang aktif:

| File | Status | Fungsi |
|------|--------|--------|
| `middleware.js` (root) | **✅ AKTIF** | Subdomain routing saja |
| `src/middleware.js` | **❌ INAKTIF** | SSO auth protection (TIDAK JALAN) |

**Kenapa?** Next.js hanya menjalankan middleware yang pertama ditemukan. Karena `middleware.js` ada di root, `src/middleware.js` diabaikan.

### Root `middleware.js` (AKTIF) — 134 baris

```javascript
import { NextResponse } from 'next/server';

export function middleware(request) {
  const hostname = request.headers.get('host');
  const pathname = request.nextUrl.pathname;
  
  // Skip internal paths
  if (pathname.startsWith('/_next/') || pathname.startsWith('/api/') || /* ... */) {
    return NextResponse.next();
  }

  // Subdomain routing
  if (hostname?.startsWith('admin.')) {
    // Rewrite admin.berkomunitas.com/* → /admin-app/*
    const url = request.nextUrl.clone();
    url.pathname = `/admin-app${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (hostname?.startsWith('rewards.')) {
    // Rewrite rewards.berkomunitas.com/* → /rewards-app/*
    const url = request.nextUrl.clone();
    url.pathname = `/rewards-app${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
```

**Tidak ada SSO protection di middleware ini.** Semua route accessible tanpa login.

### `src/middleware.js` (INAKTIF) — 201 baris

File ini TIDAK BERJALAN karena root middleware mengoverride. Jika aktif, berikut yang dilakukan:

```javascript
// Public routes (tidak perlu login)
const publicRoutes = [
  '/', '/login', '/register', '/komunitas', '/ranking',
  '/rewards', '/dashboard', /^\/profil\/[^\/]+$/,
  '/admin-app', '/admin-app/login', '/rewards-app'
];

// Protected routes (perlu login)
const protectedRoutes = [
  '/profil', '/profil/edit', '/tugas', /^\/tugas\/[^\/]+$/,
  /^\/tugas-ss\/[^\/]+$/, '/notifikasi',
  /^\/admin-app\/panel/, /^\/rewards-app\/riwayat/
];

// Auth check menggunakan jose (Edge-compatible)
import { jwtVerify } from 'jose';
// Reads sso_token cookie → verifies with JWT_SECRET
// Redirects to /login if expired/invalid
```

**Untuk mengaktifkan SSO protection:** Merge logic dari `src/middleware.js` ke root `middleware.js`.

---

## 7. Root Layout & Component Tree

### `src/app/layout.js`

```jsx
export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <GlassThemeProvider>          {/* Dark/light mode + glass effect */}
          <SubdomainHandler>          {/* Detects current subdomain */}
            <NavigationWrapper>       {/* Top navbar (responsive) */}
              <AutoGlassWrapper>      {/* Glass morphism background */}
                <ContentWrapper>      {/* Main content area */}
                  {children}
                </ContentWrapper>
              </AutoGlassWrapper>
            </NavigationWrapper>
          </SubdomainHandler>
        </GlassThemeProvider>
        <SpeedInsights />             {/* Vercel analytics */}
        <Analytics />                 {/* Vercel analytics */}
      </body>
    </html>
  );
}
```

**Component Hierarchy:**

```
<html lang="id">
  <body>
    └── GlassThemeProvider
        └── SubdomainHandler
            └── NavigationWrapper
                ├── Navbar (top)
                └── AutoGlassWrapper
                    └── ContentWrapper
                        └── {children}  ← Page content
    └── SpeedInsights
    └── Analytics
```

### `src/app/template.js`

```jsx
export default function Template({ children }) {
  return <>{children}</>;
}
```

Passthrough — tidak melakukan apa-apa. Hanya wrapper untuk Next.js template requirement.

---

## 8. CSS & Theming System

### Glass Morphism Design

Proyek menggunakan **glass morphism** design system dengan CSS variables. Themes didefinisikan di `src/app/globals.css`:

```css
:root {
  --background: 0 0% 100%;        /* White */
  --foreground: 222.2 84% 4.9%;   /* Dark text */
  --primary: 222.2 47.4% 11.2%;   /* Dark blue */
  --secondary: 210 40% 96.1%;     /* Light gray */
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;   /* Red */
  --border: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
  
  /* Glass effect variables */
  --glass-bg: rgba(255, 255, 255, 0.8);
  --glass-border: rgba(255, 255, 255, 0.3);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  
  /* Chart colors */
  --chart-1: 12 76% 61%;          /* Orange */
  --chart-2: 173 58% 39%;         /* Teal */
  --chart-3: 197 37% 24%;         /* Dark teal */
  --chart-4: 43 74% 66%;          /* Gold */
  --chart-5: 27 87% 67%;          /* Orange */
}

.dark {
  --background: 222.2 84% 4.9%;   /* Dark background */
  --foreground: 210 40% 98%;      /* Light text */
  --primary: 210 40% 98%;
  /* ... all variables flipped for dark mode */
}
```

### Glass Effect CSS Classes

```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius);
}
```

### GlassThemeProvider

Wraps the app with `next-themes` ThemeProvider:
```jsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

---

## 9. Environment Variables

### Required (.env)

```bash
# === DATABASE ===
DATABASE_URL="postgresql://user:pass@host:5432/berkomunitas?connection_limit=2"

# === SSO / AUTH ===
JWT_SECRET="your-jwt-secret-key-minimum-32-characters"
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
NEXT_PUBLIC_SSO_API_URL="/api/sso"        # atau full URL untuk cross-domain

# === MINIO STORAGE ===
MINIO_ENDPOINT="minio.yourdomain.com"     # tanpa protocol
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"
MINIO_BUCKET="berkomunitas"
MINIO_REGION="us-east-1"
MINIO_USE_SSL="true"
MINIO_PUBLIC_URL="https://minio.yourdomain.com/berkomunitas"

# === CLOUDINARY (Legacy) ===
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="xxxxx"
CLOUDINARY_API_SECRET="xxxxx"

# === VPS STORAGE (Fallback) ===
VPS_UPLOAD_URL="https://yourvps.com/upload"
VPS_UPLOAD_SECRET="your-vps-secret"

# === DRW SKINCARE API ===
DRW_API_URL="https://api.drwskincare.id"
DRW_API_KEY="your-api-key"

# === VERCEL ===
VERCEL_URL="berkomunitas.vercel.app"       # Auto-set by Vercel
```

### Optional (.env)

```bash
# === n8n WEBHOOKS ===
N8N_WEBHOOK_URL="https://n8n.yourdomain.com/webhook"
N8N_WEBHOOK_SECRET="your-webhook-secret"

# === CLERK (LEGACY — bisa dihapus) ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_xxxx"
CLERK_SECRET_KEY="sk_xxxx"
CLERK_WEBHOOK_SECRET="whsec_xxxx"
```

### Environment Variable Usage Map

| Variable | Used By | Files |
|----------|---------|-------|
| `DATABASE_URL` | Prisma | `lib/prisma.js` |
| `JWT_SECRET` | Auth | `lib/ssoAuth.js`, `src/middleware.js`, SSO routes |
| `GOOGLE_CLIENT_ID` | OAuth | SSO google-login route |
| `MINIO_*` | Storage | `lib/storage.js` |
| `CLOUDINARY_*` | Storage (legacy) | `lib/storage.js` |
| `DRW_API_*` | BC Integration | `beauty-consultant` API routes |
| `NEXT_PUBLIC_SSO_API_URL` | Client SSO | `lib/sso.js` |

---

## 10. Path Aliases & Import Conventions

### Defined Aliases

```
@/*       → ./src/*
@/lib/*   → ./lib/*
@/utils/* → ./src/utils/*
```

### Import Pattern Examples

```javascript
// ✅ Correct (using alias)
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/ssoAuth';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

// ⚠️ Found in codebase (relative — should use alias)
import prisma from '../../lib/prisma';
import { getCurrentUser } from '../../../lib/ssoAuth';
```

### Konvensi Import per Layer

| Layer | Import Style | Contoh |
|-------|-------------|--------|
| API Routes | `@/lib/*` | `import prisma from '@/lib/prisma'` |
| Components | `@/components/*`, `@/hooks/*` | `import { Button } from '@/components/ui/button'` |
| Hooks | `@/lib/*`, `@/utils/*` | fungsi helper tanpa komponen |
| Lib | Relative atau `@/lib/*` | utilities saling import |

---

## 11. Known Issues & Technical Debt

### 🔴 Critical Issues

1. **Middleware SSO auth INAKTIF**
   - `src/middleware.js` tidak berjalan karena root `middleware.js` ada
   - Semua protected route sebenarnya accessible tanpa login
   - **Fix:** Merge SSO logic ke root middleware

2. **JWT_SECRET logged to console**
   - File `lib/ssoAuth.js` melakukan `console.log` JWT_SECRET
   - Ini keamanan berat di production
   - **Fix:** Hapus console.log JWT_SECRET

3. **Duplicate Prisma Clients**
   - `lib/prisma.js` membuat 1 instance, `lib/prisma-with-sync-middleware.js` membuat instance TERPISAH
   - Connection pool doubled (4 koneksi bukan 2 di production)
   - **Fix:** Gunakan satu instance Prisma saja

### 🟡 Medium Issues

4. **Infinite recursion risk** di `prisma-with-sync-middleware.js`
   - Middleware update coin setelah loyalty berubah → bisa trigger middleware lagi
   - Dilindungi oleh `_skipMiddleware` flag tapi rawan race condition
   
5. **Missing auth di beberapa endpoint**
   - `/api/admin/redemptions/[id]/status` — tidak ada admin check
   - `/api/user/privileges` — public accessible
   - `/api/drwcorp/*` — semua endpoint tanpa auth

6. **Inconsistent import paths**
   - Mix relative paths dan `@/` alias
   - Beberapa file pakai `../../lib/prisma` bukan `@/lib/prisma`

### 🟢 Low Priority / Cleanup

7. **Clerk leftovers** — domain `img.clerk.com`, `clerk_id` field di schema, webhook handler
8. **Mock data** di `/api/admin/stats/overview` dan `/api/admin/stats/members` (TODO)
9. **Empty file** `/api/task-submissions/create/route.js` (not implemented)
10. **Debug endpoints** (8 routes) harus dihapus di production
11. **`apiClient.js`** menggunakan `memberId` yang tidak dideklarasikan

---

> **Dokumen selanjutnya:** [DOCS_2_DATABASE.md](DOCS_2_DATABASE.md) — Detail lengkap 52 tabel database dan relasinya
