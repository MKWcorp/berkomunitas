# Berkomunitas - Platform Komunitas & Loyalitas

Platform berbasis web untuk mengelola komunitas dengan sistem loyalitas terintegrasi. Anggota dapat menyelesaikan tugas, mendapatkan poin, melihat peringkat, menukar reward, dan berinteraksi dalam komunitas yang dinamis.

[![Built with Next.js](https://img.shields.io/badge/Next.js-15.4.5-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.1.1-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Clerk Auth](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=flat&logo=clerk)](https://clerk.com/)

---

## Daftar Isi

- [Ikhtisar Proyek](#ikhtisar-proyek)
- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Instalasi & Setup](#instalasi--setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Development](#development)
- [Deployment](#deployment)
- [n8n Workflow Integration](#n8n-workflow-integration)
- [API Documentation](#api-documentation)
- [Kontribusi](#kontribusi)

---

## Ikhtisar Proyek

**Berkomunitas** adalah platform komunitas digital yang mengintegrasikan sistem loyalitas, manajemen tugas, dan reward. Platform ini dirancang untuk membangun engagement komunitas melalui gamifikasi, di mana anggota dapat:

- Menyelesaikan tugas/misi dari konten sosial media
- Mengumpulkan poin loyalitas dari berbagai aktivitas
- Bersaing di leaderboard
- Menukar poin dengan reward menarik
- Berinteraksi dengan sesama anggota komunitas

Platform ini terintegrasi dengan n8n workflow automation untuk monitoring konten sosial media secara real-time dan otomatis membuat tugas baru dari postingan Instagram.

---

## Fitur Utama

### **Sistem Tugas & Poin**

- Kelola tugas/misi komunitas
- Submit tugas dengan verifikasi admin
- Notifikasi real-time untuk status tugas
- Animasi confetti saat tugas selesai
- Statistik tugas per member

### **Leaderboard & Ranking**

- Top 20 Loyalitas (berdasarkan total poin)
- Top 20 Komentar (berdasarkan jumlah komentar)
- Data precomputed untuk performa optimal
- Foto profil & username terintegrasi
- Link langsung ke profil member

### **Sistem Loyalitas & Koin**

- Kumpulkan poin loyalitas dari berbagai aktivitas
- Tracking history poin
- Tukar poin dengan reward
- Badge & achievement system
- Dashboard analitik poin

### **Manajemen Profil**

- Upload foto profil (Cloudinary integration)
- Link sosial media (Instagram, Facebook, TikTok, dll)
- Bio & status kustom
- Featured badge display
- Profile wall untuk interaksi member

### **Sistem Reward**

- Katalog reward dengan kategori
- Redeem poin untuk reward
- Verifikasi admin untuk redemption
- Tracking status reward (menunggu/selesai)
- Foto produk reward

### **Notifikasi Real-time**

- Notifikasi tugas (disetujui/ditolak)
- Notifikasi komentar di profile wall
- Notifikasi reward
- Mark as read functionality

### **Admin Dashboard**

- Manajemen member & privileges
- Verifikasi tugas & reward redemption
- Statistik global & harian
- Manajemen badge & level
- Event settings & boost multiplier
- Regional management

### **Multi-Platform Support**

- Instagram, Facebook, TikTok integration
- Webhook untuk sinkronisasi data
- Tracking komentar cross-platform

---

## Tech Stack

### **Frontend**

- **Next.js 15.4.5** - React framework dengan App Router
- **React 18.2** - UI library
- **Tailwind CSS 3.3** - Utility-first CSS
- **Tremor React** - Dashboard & chart components
- **Recharts** - Data visualization
- **FontAwesome** - Icons
- **Headless UI** - Accessible UI components

### **Backend**

- **Next.js API Routes** - Serverless API
- **Prisma 5.1.1** - ORM untuk database
- **PostgreSQL** - Relational database
- **Node.js** - Runtime environment

### **Authentication & Authorization**

- **Clerk** - User authentication & management
- Custom privilege system untuk role-based access

### **Storage & Media**

- **Cloudinary** - Image hosting & optimization
- **Dicebear API** - Avatar generation

### **Deployment & Monitoring**

- **Vercel** - Hosting & deployment
- **Vercel Analytics** - Web analytics
- **Vercel Speed Insights** - Performance monitoring

### **Integrations**

- **Svix** - Webhook infrastructure
- **n8n** - Workflow automation untuk social media monitoring

---

## Struktur Proyek

```text
komunitas-komentar/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── *.sql                  # Migration scripts
├── src/
│   └── app/
│       ├── api/               # API routes
│       │   ├── admin/         # Admin APIs
│       │   ├── dashboard/     # Dashboard data
│       │   ├── leaderboard/   # Leaderboard APIs
│       │   ├── tugas/         # Task management
│       │   ├── rewards/       # Reward system
│       │   ├── profil/        # Profile management
│       │   └── webhooks/      # External integrations
│       ├── components/        # Reusable components
│       ├── admin/             # Admin pages
│       ├── admin-app/         # Admin sub-app
│       ├── rewards-app/       # Rewards sub-app
│       ├── tugas/             # Task pages
│       ├── leaderboard/       # Leaderboard page
│       ├── profil/            # Profile pages
│       ├── rewards/           # Reward catalog
│       ├── loyalty/           # Loyalty pages
│       └── page.js            # Landing page
├── lib/
│   ├── prisma.js              # Prisma client
│   ├── apiClient.js           # API utilities
│   ├── coinLoyaltyManager.js  # Loyalty logic
│   ├── adminAuth.js           # Admin authentication
│   └── rewardNotifications.js # Notification helpers
├── scripts/                   # Utility scripts
├── public/                    # Static assets
├── middleware.js              # Next.js middleware
├── next.config.mjs            # Next.js configuration
├── tailwind.config.js         # Tailwind configuration
└── vercel.json                # Vercel deployment config
```

---

## Instalasi & Setup

### **Prerequisites**

- Node.js >= 18.x
- npm atau yarn
- PostgreSQL database
- Clerk account (untuk authentication)
- Cloudinary account (untuk image hosting)

### **1. Clone Repository**

```bash
git clone https://github.com/MKWcorp/berkomunitas.git
cd berkomunitas
```

### **2. Install Dependencies**

```bash
npm install
```

### **3. Setup Environment Variables**

Buat file `.env` di root directory (lihat bagian [Environment Variables](#environment-variables))

### **4. Setup Database**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
npx prisma db seed
```

### **5. Run Development Server**

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

---

## Environment Variables

Buat file `.env` dengan variabel berikut:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/komunitas_db"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"
CLERK_SECRET_KEY="sk_test_xxxxx"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"

# Cloudinary (untuk upload gambar)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Admin Configuration
ADMIN_SECRET="your-admin-secret-key"

# Webhook Secrets (optional)
CLERK_WEBHOOK_SECRET="whsec_xxxxx"

# n8n Integration (optional)
N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/xxxxx"

# API Base URL (untuk production)
NEXT_PUBLIC_API_BASE_URL="https://berkomunitas.com"
```

---

## Database Setup

### **Schema Overview**

Database menggunakan PostgreSQL dengan Prisma ORM. Model utama:

- **members** - Data anggota komunitas
- **user_usernames** - Username unique per member
- **tugas_ai** - Task/misi komunitas
- **task_submissions** - Submission tugas dari member
- **loyalty_point_history** - History perolehan poin
- **badges** - Badge/achievement
- **member_badges** - Badge yang dimiliki member
- **rewards** - Katalog reward
- **reward_redemptions** - Riwayat penukaran reward
- **notifications** - Sistem notifikasi
- **comments** - Komentar cross-platform
- **profil_sosial_media** - Social media links
- **peringkat_member_top20_loyalty** - Precomputed leaderboard loyalitas
- **peringkat_member_top20_comments** - Precomputed leaderboard komentar

### **Database Migrations**

```bash
# Buat migration baru
npx prisma migrate dev --name migration_name

# Apply migration ke production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### **Prisma Studio**

Untuk mengakses database GUI:

```bash
npx prisma studio
```

---

## Development

### **Commands**

```bash
# Development server
npm run dev

# Build untuk production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Prisma commands
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Create & apply migration
npx prisma studio            # Open database GUI
```

### **Code Structure Best Practices**

- API routes di `src/app/api/`
- Client components dengan `'use client'` directive
- Server components default (tanpa directive)
- Reusable components di `src/app/components/`
- Utilities di `lib/`
- Database queries menggunakan Prisma client

### **Key Features Implementation**

#### **Real-time Updates**

Polling mechanism dengan interval:

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 5000); // 5 detik
  return () => clearInterval(interval);
}, []);
```

#### **Optimized Leaderboard**

Menggunakan precomputed tables untuk performa:

- `peringkat_member_top20_loyalty`
- `peringkat_member_top20_comments`

Data diupdate dengan cron job atau trigger database.

#### **Admin Privileges**

System privilege check:

```javascript
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET(request) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }
  // Admin-only logic
}
```

---

## Deployment

### **Vercel (Recommended)**

1. Push code ke GitHub repository
2. Connect repository ke Vercel
3. Configure environment variables di Vercel dashboard
4. Deploy otomatis setiap push ke main branch

### **Vercel Configuration**

File `vercel.json` sudah dikonfigurasi dengan:

- Function timeout: 30 detik
- Subdomain routing (admin.berkomunitas.com, rewards.berkomunitas.com)
- Custom headers & redirects

### **Database Production**

Gunakan managed PostgreSQL:

- **Supabase** (recommended)
- **Neon**
- **Railway**
- **AWS RDS**

Update `DATABASE_URL` di environment variables Vercel.

### **Post-Deployment Checklist**

- Setup database & run migrations
- Configure all environment variables
- Test authentication flow
- Verify webhook endpoints
- Test image upload (Cloudinary)
- Monitor logs & errors

---

## n8n Workflow Integration

Platform ini menggunakan n8n untuk automasi monitoring konten sosial media dan pembuatan tugas secara otomatis.

### **Ikhtisar Workflow**

Workflow n8n berjalan secara otomatis untuk mengambil postingan media baru dari beberapa akun Instagram, memfilter duplikat, dan menyiapkan data untuk pembuatan tugas di platform.

### **Alur Kerja (Step-by-Step)**

1. **Trigger (Schedule Trigger)**
   - Memulai workflow secara otomatis pada jadwal yang ditentukan (misalnya setiap 15 menit)
   - Mendukung monitoring real-time konten baru

2. **Ambil Daftar Akun (List Sosial Media)**
   - Mengambil daftar semua akun media sosial yang perlu dipantau
   - Output: Array berisi objek akun dengan `accountId`

3. **Iterasi Akun (Loop Over Items)**
   - Melakukan iterasi untuk setiap akun yang dipantau
   - Memproses satu per satu untuk efisiensi

4. **Ambil Media dari Akun (Get Media)**
   - Menghubungi Instagram API untuk mengambil postingan terbaru
   - Mengambil hingga 25 postingan terakhir per akun

5. **Pecah Data (Split Out)**
   - Memecah array postingan menjadi item individual
   - Setiap postingan diproses secara terpisah

6. **Penyuntikan Konteks (Edit Fields - Enrichment)**
   - **Node krusial:** Menambahkan `accountId` ke setiap item media
   - Memastikan setiap postingan memiliki informasi akun asal
   - Penting untuk tracking dan deduplikasi

7. **Ambil Data yang Ada (Get Existing IDs from DB)**
   - Dijalankan paralel dengan langkah lain
   - Query database untuk mendapatkan ID media yang sudah diproses
   - Mencegah duplikasi tugas

8. **Filter Duplikat (Cek yang belum dibuat tugas)**
   - Node Merge/Combine untuk deduplikasi
   - Membandingkan media baru dengan database
   - Hanya meneruskan media yang benar-benar baru

9. **Pemrosesan Akhir (Edit Fields - Final)**
   - Transformasi data akhir
   - Mapping `accountId` ke `source_profile_link`
   - Format timestamp dan persiapan output

### **Alur Data**

**List Sosial Media (Output):**
```json
[
  { "accountId": "178...1" },
  { "accountId": "178...2" }
]
```

**Loop Over Items (Iterasi):**
```json
{ "accountId": "178...1" }
```

**Split Out (Output per item):**
```json
{
  "id": "media_id_123",
  "caption": "...",
  "permalink": "..."
}
```

**Edit Fields - Enrichment (Diperkaya):**
```json
{
  "id": "media_id_123",
  "caption": "...",
  "permalink": "...",
  "accountId": "178...1"
}
```

**Cek yang belum dibuat tugas (Output):**
- Hanya media yang ID-nya tidak ditemukan di database

**Edit Fields - Final (Output):**
```json
{
  "id": "media_id_123",
  "permalink": "https://instagram.com/p/...",
  "post_timestamp": "2025-11-08T10:30:00Z",
  "platform": "Instagram",
  "source_profile_link": "https://instagram.com/drwskincareshop"
}
```

### **Objektif Workflow**

Sistem ini menciptakan workflow yang:
- **Andal:** Monitoring otomatis tanpa intervensi manual
- **Efisien:** Hanya memproses konten baru (no duplicates)
- **Terstruktur:** Data diperkaya dengan konteks lengkap
- **Scalable:** Mendukung multiple akun dan platform

### **Konfigurasi n8n**

Untuk mengintegrasikan n8n dengan platform:

1. Setup webhook endpoint di n8n
2. Tambahkan webhook URL ke environment variables
3. Konfigurasi Instagram API credentials
4. Setup database connection untuk deduplikasi
5. Configure schedule trigger sesuai kebutuhan

```env
N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/xxxxx"
```

---

## API Documentation

### **Public APIs**

#### **GET /api/leaderboard**
Get top 20 leaderboard (loyalty & comments)
```javascript
// Response
{
  "loyaltyLeaderboard": [
    {
      "peringkat": 1,
      "id_member": 123,
      "loyalty_point": 5000,
      "foto_profil_url": "https://...",
      "nama_lengkap": "John Doe",
      "username": "johndoe",
      "display_name": "JohnD"
    }
  ],
  "commentLeaderboard": [...]
}
```

#### **GET /api/dashboard**
Get dashboard statistics
```javascript
// Response
{
  "totalMembers": 100,
  "totalTasks": 50,
  "totalPoints": 10000,
  "recentActivity": [...]
}
```

#### **GET /api/tugas**
Get available tasks
```javascript
// Query params: ?status=tersedia&limit=20
```

#### **POST /api/tugas/[id]/submit**
Submit task completion
```javascript
// Body: { memberId: 123, commentId: "xxx" }
```

### **Admin APIs**
Semua admin APIs memerlukan authentication & privilege check:
- `POST /api/admin/verify-task` - Verify task submission
- `POST /api/admin/badges` - Manage badges
- `GET /api/admin/statistics` - Get admin statistics
- `POST /api/admin/rewards/verify` - Verify reward redemption

### **Webhook APIs**
- `POST /api/webhooks/clerk` - Clerk user events
- `POST /api/webhooks/n8n` - n8n workflow integration

---

## Customization

### **Branding**

- Logo: `/public/logo-b.png`
- Landing background: `/public/landing-background.jpg`
- Colors: Edit `tailwind.config.js`

### **Point Rules**

Edit di database table `loyalty_point_rules`:

```sql
INSERT INTO loyalty_point_rules (event_type, description, point_value)
VALUES ('comment_verified', 'Komentar diverifikasi', 10);
```

### **Badge Criteria**

Edit di database table `badges`:

```sql
INSERT INTO badges (badge_name, description, criteria_type, criteria_value)
VALUES ('Commentator', 'Buat 100 komentar', 'comment_count', 100);
```

---

## Kontribusi

Kontribusi sangat diterima! Ikuti langkah berikut:

1. Fork repository
2. Buat branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

### **Coding Standards**

- ESLint configuration sudah disediakan
- Format code dengan Prettier (optional)
- Tulis deskripsi commit yang jelas
- Test fitur sebelum submit PR

---

## License

Project ini adalah private/internal. Hubungi owner untuk informasi licensing.

---

## Team & Support

**Developed by:** MKWcorp Team

**Support:**
- Email: support@berkomunitas.com
- GitHub Issues: [Create an issue](https://github.com/MKWcorp/berkomunitas/issues)

---

## Updates & Changelog

### **Latest Updates**

- Optimized leaderboard dengan precomputed tables
- Real-time dashboard & notifications
- Profile photo integration dengan Cloudinary
- Username system dengan `@mentions`
- Multi-platform comment tracking
- n8n workflow automation untuk social media monitoring

### **Roadmap**

- Mobile app (React Native)
- Advanced analytics dashboard
- Gamification features
- AI-powered task recommendations
- Social feed & timeline

---

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Clerk](https://clerk.com/) - Authentication & User Management
- [Vercel](https://vercel.com/) - Deployment Platform
- [Cloudinary](https://cloudinary.com/) - Media Management
- [n8n](https://n8n.io/) - Workflow Automation

---

**Jika project ini membantu, berikan star di GitHub!**
