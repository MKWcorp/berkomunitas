# 📗 DOKUMENTASI 2: DATABASE SCHEMA & MODEL DETAIL

## Berkomunitas — 52 Tabel PostgreSQL (Prisma ORM)

> Dokumen ini menjelaskan SETIAP tabel, field, relasi, index, dan business rules dalam database.

---

## Daftar Isi

1. [Konfigurasi Database](#1-konfigurasi-database)
2. [Entity Relationship Overview](#2-entity-relationship-overview)
3. [Core Tables](#3-core-tables)
4. [Task System Tables](#4-task-system-tables)
5. [Points & Currency Tables](#5-points--currency-tables)
6. [Reward System Tables](#6-reward-system-tables)
7. [Social Media & Comments Tables](#7-social-media--comments-tables)
8. [Instagram Tables](#8-instagram-tables)
9. [Facebook Tables](#9-facebook-tables)
10. [TikTok Tables](#10-tiktok-tables)
11. [DRW Integration Tables](#11-drw-integration-tables)
12. [Auth & Session Tables](#12-auth--session-tables)
13. [Statistics & View Tables](#13-statistics--view-tables)
14. [System Tables](#14-system-tables)
15. [Business Rules & Invariants](#15-business-rules--invariants)
16. [Index Strategy](#16-index-strategy)

---

## 1. Konfigurasi Database

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = []
  engineType      = "binary"       // Binary engine (not library/wasm)
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")   // Format: postgresql://user:pass@host:5432/db?connection_limit=2
}
```

**Connection Settings:**
- Production: `connection_limit=2` (Vercel serverless = ~50 concurrent functions, jadi 2 per function)
- Development: `connection_limit=10`
- Engine: Binary (lebih stabil tapi lebih besar dari library engine)

---

## 2. Entity Relationship Overview

### Diagram Relasi Utama

```
                            ┌──────────────┐
                            │   members    │ ← Central entity
                            │   (52 cols)  │
                            └──────┬───────┘
                                   │
                 ┌─────────────────┼──────────────────┐
                 │                 │                    │
    ┌────────────┴──┐   ┌────────┴────────┐   ┌──────┴────────┐
    │ user_privileges│   │ PlatformSession  │   │ UserActivity   │
    │ (admin/plus)   │   │ (JWT sessions)   │   │ (login, etc)   │
    └───────────────┘   └─────────────────┘   └───────────────┘
                 │                 
    ┌────────────┴──┐   ┌─────────────────┐   ┌───────────────┐
    │ coin_history   │   │ loyalty_point_   │   │ member_        │
    │ (coin events)  │   │ history          │   │ transactions   │
    └───────────────┘   └─────────────────┘   └───────────────┘
                 │
    ┌────────────┴──┐   ┌─────────────────┐   ┌───────────────┐
    │ task_          │   │ tugas_ai_2_      │   │ reward_        │
    │ submissions    │   │ screenshots      │   │ redemptions    │
    └───────┬───────┘   └───────┬─────────┘   └───────┬───────┘
            │                   │                      │
    ┌───────┴───────┐   ┌──────┴──────┐       ┌───────┴───────┐
    │ tugas_ai      │   │ tugas_ai_2  │       │ rewards       │
    │ (comment task)│   │ (SS task)   │       │ (reward items)│
    └───────┬───────┘   └─────────────┘       └───────┬───────┘
            │                                          │
    ┌───────┴───────┐                         ┌───────┴───────┐
    │ media         │                         │ reward_        │
    │ (IG media)    │                         │ categories     │
    └───────────────┘                         └───────────────┘
```

---

## 3. Core Tables

### 3.1 `members` — Tabel Utama Member ⭐

**Central entity.** Semua data user berpusat di sini.

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK, autoincrement | ID unik member |
| `nama_lengkap` | `String?` | nullable | Nama lengkap member |
| `email` | `String?` | unique | Email (dari Google OAuth) |
| `google_id` | `String?` | unique | Google Account ID |
| `clerk_id` | `String?` | unique | **LEGACY** Clerk user ID |
| `nomer_wa` | `String?` | nullable | Nomor WhatsApp |
| `bio` | `String?` | nullable | Bio profil |
| `status_kustom` | `String?` | nullable | Status custom (mood) |
| `foto_profil_url` | `String?` | nullable | URL foto profil (MinIO/Cloudinary) |
| `featured_badge_id` | `String?` | nullable | Badge yang ditampilkan |
| `loyalty_point` | `Int` | default: 0 | Poin loyalty (permanent, naik terus) |
| `coin` | `Int` | default: 0 | Coin (spendable, coin ≤ loyalty) |
| `tanggal_daftar` | `DateTime?` | default: now() | Tanggal registrasi |
| `last_login_at` | `DateTime?` | nullable | Terakhir login |
| `sso_metadata` | `Json?` | default: `{}` | Metadata SSO (lastLoginPlatform, linkedWithGoogle, dll) |

**Indexes:**
- `idx_members_coin` → `coin`
- `idx_members_loyalty_point` → `loyalty_point`
- `idx_members_google_id` → `google_id`
- `idx_members_email` → `email`

**Relations (has many):**
- `coin_history[]` — Riwayat coin
- `loyalty_point_history[]` — Riwayat loyalty point
- `member_badges[]` — Badge yang dimiliki
- `member_emails[]` — Email tambahan
- `member_task_stats?` — Statistik task (1:1)
- `member_transactions[]` — Transaksi
- `notifications[]` — Notifikasi
- `profil_sosial_media[]` — Profil sosmed
- `profile_wall_posts[]` — Wall posts (sebagai author dan owner)
- `reward_redemptions[]` — Redemption reward
- `task_submissions[]` — Submission tugas
- `tugas_ai_2_screenshots[]` — Screenshot tugas
- `user_privileges[]` — Privilege (admin/plus)
- `user_usernames?` — Username custom (1:1)
- `PlatformSession[]` — Session login
- `UserActivity[]` — Log aktivitas
- `bc_drwskincare_plus?` — Koneksi DRW Skincare (1:1)
- `drwcorp_employees[]` — Link ke karyawan DRW Corp

### 3.2 `user_usernames` — Username Custom

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `member_id` | `Int` | unique, FK → members | 1:1 dengan member |
| `username` | `String` | unique, varchar(50) | Username unique |
| `display_name` | `String?` | varchar(100) | Nama tampilan |
| `is_custom` | `Boolean?` | default: false | Apakah custom atau auto-generated |
| `created_at` | `DateTime?` | default: now() | - |
| `updated_at` | `DateTime?` | default: now() | - |

### 3.3 `member_emails` — Email Tambahan

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `member_id` | `Int?` | FK → members (CASCADE) | - |
| `clerk_id` | `String?` | varchar(255) | **LEGACY** Clerk ID |
| `email` | `String` | unique, varchar(255) | Email address |
| `is_primary` | `Boolean?` | default: false | Email utama |
| `verified` | `Boolean?` | default: false | Sudah terverifikasi |

### 3.4 `notifications` — Notifikasi

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `id_member` | `Int` | FK → members (CASCADE) | - |
| `message` | `String` | - | Isi notifikasi |
| `is_read` | `Boolean?` | default: false | Sudah dibaca |
| `link_url` | `String?` | - | URL tujuan saat diklik |
| `created_at` | `DateTime?` | default: now() | - |

### 3.5 `profil_sosial_media` — Profil Social Media Member

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `id_member` | `Int` | FK → members (CASCADE) | - |
| `platform` | `String` | varchar(50) | Platform: instagram, facebook, tiktok, dll |
| `username_sosmed` | `String` | - | Username di platform tersebut |
| `profile_link` | `String?` | - | URL profil |
| `platform_user_id` | `String?` | varchar(255) | ID di platform |

**Unique Constraint:** `(id_member, platform, username_sosmed)`

### 3.6 `profile_wall_posts` — Tulisan di Dinding Profil

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `profile_owner_id` | `Int` | FK → members (CASCADE) | Pemilik profil |
| `author_id` | `Int` | FK → members (CASCADE) | Penulis pesan |
| `message` | `String` | - | Isi pesan wall |
| `created_at` | `DateTime?` | default: now() | - |

**Dual FK:** Satu member bisa menulis di wall member lain.

### 3.7 `partners` — Partner/Mitra

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `platform` | `String` | varchar(50) | Platform partner |
| `link_profil` | `String` | - | Link profil |
| `username` | `String` | unique, varchar(100) | Username |
| `email` | `String?` | unique, varchar(255) | Email |
| `tanggal_pendaftaran` | `DateTime?` | default: now() | - |

### 3.8 `SocialLink` — Social Links (Unused?)

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `url` | `String` | - | URL sosial |
| `memberId` | `Int` | - | **⚠️ No FK defined** |

**⚠️ Note:** Tidak ada relasi di Prisma schema. Kemungkinan tabel orphan/unused.

---

## 4. Task System Tables

### 4.1 `tugas_ai` — Tugas Komentar (Task Gen 1) ⭐

Tugas yang meminta member untuk comment di post Instagram.

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `keyword_tugas` | `String?` | varchar(255) | Kata kunci yang harus ada di komentar |
| `deskripsi_tugas` | `String?` | - | Deskripsi tugas |
| `link_postingan` | `String?` | - | URL post yang harus dikomentari |
| `status` | `String` | default: "tersedia", varchar(50) | tersedia / ditutup |
| `media_id` | `String?` | unique → media | Link ke tabel media (IG) |
| `source_profile_link` | `String?` | - | Link profil IG sumber |
| `point_value` | `Int?` | default: 10 | Poin reward |
| `post_timestamp` | `DateTime` | default: now() | Timestamp post |
| `created_at` | `DateTime?` | default: now() | - |
| `updated_at` | `DateTime?` | - | - |

**Relations:**
- `task_submissions[]` — Submission dari member
- `media?` → `media` table — Link ke media Instagram

### 4.2 `tugas_ai_2` — Tugas Screenshot (Task Gen 2) ⭐

Tugas yang meminta member untuk upload screenshot bukti komentar. Mendukung multi-platform (TikTok, Facebook, Instagram).

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `keyword_tugas` | `String?` | varchar(255) | Kata kunci tugas |
| `deskripsi_tugas` | `String?` | - | Deskripsi |
| `link_postingan` | `String?` | - | URL post target |
| `status` | `String` | default: "tersedia", varchar(50) | tersedia / ditutup |
| `point_value` | `Int?` | default: 10 | Poin reward |
| `source` | `String?` | varchar(50) | Platform sumber: `tiktok` \| `facebook` \| `instagram` |
| `tiktok_content_id` | `Int?` | FK → tiktok_contents (optional) | Link ke konten TikTok sumber |
| `verification_rules` | `Json?` | - | Aturan verifikasi AI: `{ keyword, platform, min_confidence, check_username }` |
| `max_submissions` | `Int?` | default: 1 | Max kali tugas bisa dikerjakan per user (untuk retry) |
| `post_timestamp` | `DateTime` | default: now() | Timestamp post |
| `expires_at` | `DateTime?` | timestamptz | Waktu task kadaluarsa (null = tidak ada batas) |
| `created_at` | `DateTime?` | default: now() | - |
| `updated_at` | `DateTime?` | - | - |

**Relations:**
- `tugas_ai_2_screenshots[]` — Screenshots bukti
- `tugas_ai_2_submissions[]` — Submission progress per member

**Indexes:** `status`, `source`, `tiktok_content_id`, `expires_at`

---

### 4.2a `tugas_ai_2_submissions` — Submission Progress per Member ⭐ **NEW**

Tabel ini adalah **source of truth** untuk progress dan status setiap member di task-task `tugas_ai_2`. Menggantikan `facebook_task_submissions` dan menyatukan semua platform (TikTok, Facebook, Instagram).

**Status Machine:**
```
dikerjakan → sedang_verifikasi → selesai
                               ↘ gagal → (retry) → dikerjakan
dikerjakan → expired (jika batas_waktu terlewat)
```

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `tugas_ai_2_id` | `Int` | FK → tugas_ai_2 (CASCADE) | ID tugas |
| `member_id` | `Int` | FK → members (CASCADE) | ID member |
| `platform` | `String` | varchar(50) | Platform: `tiktok` \| `facebook` \| `instagram` |
| `status` | `String` | default: "dikerjakan", varchar(50) | Status machine (lihat atas) |
| `created_at` | `DateTime` | default: now() | - |
| `waktu_klik` | `DateTime?` | timestamptz | Saat user klik tombol "Kerjakan" |
| `waktu_upload` | `DateTime?` | timestamptz | Saat screenshot diupload |
| `batas_waktu` | `DateTime?` | timestamptz | Deadline: waktu_klik + window (default 24h) |
| `waktu_verifikasi` | `DateTime?` | timestamptz | Saat status final ditetapkan |
| `waktu_selesai` | `DateTime?` | timestamptz | Saat status `selesai` |
| `updated_at` | `DateTime?` | - | - |
| `verification_attempts` | `Int` | default: 0 | Jumlah percobaan verifikasi AI |
| `max_retries` | `Int` | default: 3 | Max retry jika gagal |
| `verified_by` | `String?` | varchar(255) | `n8n_ai` \| `admin:{id}` \| `auto` |
| `point_awarded` | `Int?` | - | Poin aktual yang diberikan |
| `notes` | `String?` | - | Catatan admin/system |
| `rejection_reason` | `String?` | varchar(500) | Alasan penolakan (terstruktur) |
| `metadata` | `Json?` | - | Extensible: `{ ip, user_agent, tiktok_username, ... }` |

**Unique Constraint:** `(member_id, tugas_ai_2_id)` — Satu submission aktif per member per task

**Indexes:** `tugas_ai_2_id`, `member_id`, `status`, `platform`

### 4.3 `task_submissions` — Submission Tugas (Gen 1) ⭐

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `id_task` | `Int` | FK → tugas_ai (CASCADE) | ID tugas |
| `id_member` | `Int` | FK → members (CASCADE) | ID member |
| `status_submission` | `String` | default: "tersedia", varchar(50) | Status: tersedia/dikerjakan/selesai/gagal |
| `waktu_klik` | `DateTime?` | - | Saat member klik "kerjakan" |
| `tanggal_submission` | `DateTime?` | default: now() | Tanggal submit |
| `tanggal_verifikasi` | `DateTime?` | - | Tanggal admin/n8n verifikasi |
| `admin_notes` | `String?` | - | Catatan admin |
| `comment_id` | `Int?` | - | ID komentar yang matched |
| `verified_by` | `String?` | varchar(255) | Siapa yang verifikasi |
| `batas_waktu` | `DateTime?` | - | Deadline submission |
| `keterangan` | `String?` | - | Keterangan tambahan |
| `validation_status` | `String?` | varchar(50) | Status validasi |
| `scheduled_check_at` | `DateTime?` | - | Jadwal check oleh n8n |
| `gagal_diverifikasi_verification_attempts` | `Int?` | default: 0 | Jumlah percobaan verifikasi gagal |

**Unique Constraint:** `(id_member, id_task)` — Satu member hanya bisa submit sekali per tugas

**Indexes:** `status_submission`

### 4.4 `tugas_ai_2_screenshots` — Screenshot Bukti Tugas (Gen 2) ⭐

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `tugas_ai_2_id` | `Int` | FK → tugas_ai_2 (CASCADE) | ID tugas |
| `member_id` | `Int?` | FK → members (CASCADE) | ID member |
| `submission_id` | `Int?` | FK → tugas_ai_2_submissions | **NEW** Link ke submission aktif |
| `task_submission_id` | `Int?` | - | ⚠️ LEGACY (no FK), digantikan oleh submission_id |
| `screenshot_url` | `String` | - | URL screenshot di MinIO |
| `screenshot_filename` | `String?` | varchar(255) | Nama file asli |
| `link_komentar` | `String?` | - | Link komentar sebagai bukti |
| `status` | `String?` | default: "sedang_verifikasi", varchar(50) | Status verifikasi |
| `uploaded_at` | `DateTime` | default: now() | Waktu upload |
| `verified_at` | `DateTime?` | - | Waktu terverifikasi |
| `verification_attempts` | `Int?` | default: 0 | Jumlah percobaan |
| `ai_extracted_text` | `String?` | - | Teks yang diekstrak AI dari screenshot |
| `ai_confidence_score` | `Float?` | - | Skor kepercayaan AI (0-1) |
| `ai_verification_result` | `Json?` | - | Result lengkap dari AI verification |
| `n8n_webhook_id` | `String?` | varchar(255) | ID webhook n8n |
| `n8n_execution_id` | `String?` | varchar(255) | ID eksekusi n8n |
| `processing_started_at` | `DateTime?` | - | Mulai diproses |
| `processing_completed_at` | `DateTime?` | - | Selesai diproses |
| `admin_notes` | `String?` | - | Catatan admin |
| `created_at` | `DateTime` | default: now() | - |
| `updated_at` | `DateTime?` | - | - |

**Indexes:** `tugas_ai_2_id`, `member_id`, `(tugas_ai_2_id, member_id)`, `status`, `submission_id`, `n8n_webhook_id`

### 4.5 `facebook_task_submissions` — Submission Tugas Facebook

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `id_task` | `Int?` | - | ⚠️ No FK |
| `id_member` | `Int?` | - | ⚠️ No FK |
| `status_submission` | `String?` | default: "tersedia" | Status |
| `waktu_klik` | `DateTime?` | - | - |
| `waktu_verifikasi` | `DateTime?` | - | - |
| `admin_notes` | `String?` | - | - |
| `comment_id` | `Int?` | - | - |
| `isi_komentar` | `String?` | - | Isi komentar |
| `validation_status` | `String?` | - | - |
| `gagal_diverifikasi_verification_attempts` | `Int?` | default: 0 | - |

**⚠️ Catatan:** Tabel ini TIDAK punya FK ke members atau tugas. Standalone table. Kemungkinan perlu dimigrasi ke `task_submissions` yang unified.

### 4.6 `facebook_tugas_ai` — Tugas Facebook AI

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `facebook_post_url` | `String` | - | URL post Facebook |
| `task_type` | `String?` | varchar(50) | Tipe tugas |
| `page_id` | `String?` | varchar(255) | Facebook Page ID |
| `status` | `String?` | default: "tersedia" | Status |
| `point_value` | `Int?` | default: 10 | Poin |
| `rekomendasi_tugas` | `String?` | - | Rekomendasi AI |
| `rekomendasi_keyword` | `String?` | varchar(255) | Keyword |
| `post_id` | `String?` | varchar(100) | Post ID |
| `facebook_page_id` | `String?` | varchar(255) | Page ID |
| `minimum_kata_komentar` | `Int?` | default: 5 | Min kata di komentar |
| `created_time` | `DateTime?` | default: now() | - |
| `updated_at` | `DateTime?` | - | - |

### 4.7 `member_task_stats` — Statistik Task per Member

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `member_id` | `Int` | PK, FK → members (CASCADE) | 1:1 |
| `total_tasks` | `Int` | default: 0 | Total tugas diambil |
| `completed_tasks` | `Int` | default: 0 | Tugas selesai |
| `pending_tasks` | `Int` | default: 0 | Tugas pending |
| `failed_tasks` | `Int` | default: 0 | Tugas gagal |
| `updated_at` | `DateTime` | default: now() | Terakhir di-update |

---

## 5. Points & Currency Tables

### 5.1 `coin_history` — Riwayat Coin ⭐

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `member_id` | `Int` | FK → members (CASCADE) | - |
| `event` | `String` | - | Deskripsi event ("Login via Google SSO", "Task completed", dll) |
| `coin` | `Int` | - | Jumlah coin (+/-) |
| `event_type` | `String` | default: "manual" | Tipe: manual/login/task/redeem/admin |
| `comment_id` | `Int?` | - | ID komentar terkait |
| `task_id` | `Int?` | - | ID tugas terkait |
| `created_at` | `DateTime?` | default: now() | - |

**Indexes:** `member_id`, `event_type`, `created_at`

### 5.2 `loyalty_point_history` — Riwayat Loyalty Point ⭐

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `member_id` | `Int` | FK → members | - |
| `event` | `String` | - | Deskripsi event |
| `point` | `Int` | - | Jumlah poin (+/-) |
| `event_type` | `String?` | varchar(50) | Tipe event |
| `comment_id` | `Int?` | - | ID komentar |
| `task_id` | `Int?` | - | ID tugas |
| `created_at` | `DateTime` | default: now() | - |

### 5.3 `loyalty_point_rules` — Aturan Poin

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `event_type` | `String` | PK, varchar(50) | Tipe event (login, task_complete, dll) |
| `description` | `String?` | - | Deskripsi event |
| `point_value` | `Int` | - | Poin yang diberikan |

### 5.4 `member_transactions` — Transaksi Member

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `member_id` | `Int` | FK → members (CASCADE) | - |
| `transaction_type_id` | `Int` | FK → transaction_types | - |
| `loyalty_amount` | `Int?` | default: 0 | Jumlah loyalty yang berubah |
| `coin_amount` | `Int?` | default: 0 | Jumlah coin yang berubah |
| `description` | `String?` | - | Deskripsi transaksi |
| `reference_table` | `String?` | varchar(50) | Tabel referensi |
| `reference_id` | `Int?` | - | ID referensi |
| `loyalty_balance_before` | `Int?` | - | Saldo sebelum |
| `loyalty_balance_after` | `Int?` | - | Saldo sesudah |
| `coin_balance_before` | `Int?` | - | Saldo coin sebelum |
| `coin_balance_after` | `Int?` | - | Saldo coin sesudah |
| `created_at` | `DateTime?` | default: now() | - |

**Indexes:** `member_id`, `transaction_type_id`, `created_at DESC`

### 5.5 `transaction_types` — Tipe Transaksi

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `type_code` | `String` | unique, varchar(50) | Kode unik: "login", "task_complete", "redeem", dll |
| `name` | `String` | varchar(100) | Nama yang tampil |
| `affects_loyalty` | `Boolean?` | default: true | Mempengaruhi loyalty? |
| `affects_coin` | `Boolean?` | default: true | Mempengaruhi coin? |
| `is_credit` | `Boolean?` | default: true | Kredit (tambah) atau debit (kurang)? |
| `created_at` | `DateTime?` | default: now() | - |

### 5.6 `levels` — Level Ranking

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `level_number` | `Int` | PK | Nomor level 1-19 |
| `level_name` | `String` | varchar(100) | Nama level (Neraka Jahannam, dll) |
| `required_points` | `Int` | unique | Poin minimum untuk level ini |

---

## 6. Reward System Tables

### 6.1 `rewards` — Item Reward ⭐

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `reward_name` | `String` | varchar(255) | Nama reward |
| `description` | `String?` | - | Deskripsi |
| `point_cost` | `Int` | - | Harga dalam coin |
| `stock` | `Int?` | default: 0 | Stok tersedia |
| `is_active` | `Boolean?` | default: true | Aktif ditampilkan? |
| `foto_url` | `String?` | - | URL foto reward |
| `category_id` | `Int?` | FK → reward_categories | Kategori |
| `is_exclusive` | `Boolean?` | default: false | Eksklusif? |
| `required_privilege` | `String?` | varchar(50) | Privilege requirement (misal: "BerkomunitasPlus") |
| `privilege_description` | `String?` | - | Deskripsi privilege |
| `created_at` | `DateTime?` | default: now() | - |

**Indexes:** `category_id`, `required_privilege`

### 6.2 `reward_categories` — Kategori Reward

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `name` | `String` | varchar(100) | Nama kategori |
| `description` | `String?` | - | Deskripsi |
| `icon` | `String?` | varchar(50) | Icon name |
| `color` | `String?` | default: "blue", varchar(20) | Warna tema |
| `sort_order` | `Int?` | default: 0 | Urutan tampil |
| `is_active` | `Boolean?` | default: true | Aktif? |
| `created_at` | `DateTime?` | default: now() | - |
| `updated_at` | `DateTime?` | default: now() | - |

### 6.3 `reward_redemptions` — Penukaran Reward ⭐

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `id_member` | `Int` | FK → members (CASCADE) | - |
| `id_reward` | `Int` | FK → rewards (NO ACTION) | - |
| `points_spent` | `Int` | - | Coin yang dihabiskan |
| `quantity` | `Int` | default: 1 | Jumlah yang diredeem |
| `status` | `String?` | default: "menunggu_verifikasi", varchar(50) | Status redemption |
| `redemption_notes` | `String?` | - | Catatan |
| `redeemed_at` | `DateTime?` | default: now() | Waktu redeem |
| `shipped_at` | `DateTime?` | - | Waktu dikirim |
| `delivered_at` | `DateTime?` | - | Waktu diterima |
| `shipping_method` | `String?` | default: "separate", varchar(50) | Metode kirim |
| `shipping_cost` | `Int?` | default: 0 | Biaya kirim |
| `shipping_notes` | `String?` | - | Catatan pengiriman |

**Status Flow:** `menunggu_verifikasi` → `diproses` → `dikirim` → `diterima` / `ditolak`

### 6.4 `badges` — Definisi Badge

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `badge_name` | `String` | unique, varchar(100) | Nama badge |
| `description` | `String?` | - | Deskripsi |
| `criteria_type` | `String` | varchar(50) | Tipe kriteria (manual, auto) |
| `criteria_value` | `Int` | - | Nilai kriteria |
| `badge_color` | `String?` | default: "blue", varchar(20) | Warna badge |
| `badge_style` | `String?` | default: "flat", varchar(20) | Style badge |
| `badge_message` | `String?` | default: "Achievement", varchar(50) | Pesan badge |

### 6.5 `member_badges` — Badge yang Dimiliki Member

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `id_member` | `Int` | FK → members (CASCADE) | - |
| `id_badge` | `Int` | FK → badges (CASCADE) | - |
| `earned_at` | `DateTime?` | default: now() | Tanggal diperoleh |

**Unique Constraint:** `(id_member, id_badge)` — Satu badge per member

---

## 7. Social Media & Comments Tables

### 7.1 `comments` — Komentar (Multi-Platform) ⭐

Tabel utama untuk menyimpan komentar yang di-scrape dari berbagai platform.

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `comment_id` | `String` | unique | ID komentar di platform |
| `permalink` | `String?` | - | Link langsung ke komentar |
| `post_timestamp` | `DateTime?` | - | Waktu post asli |
| `comment_timestamp` | `DateTime?` | - | Waktu komentar |
| `username` | `String?` | varchar(255) | Username yang comment |
| `comment` | `String?` | - | Isi komentar |
| `source_profile_link` | `String?` | - | Link profil sumber post |
| `platform` | `String?` | varchar(50) | Platform: instagram/facebook/tiktok |
| `id_task` | `Int?` | - | ID tugas terkait (⚠️ no FK) |
| `id_member` | `Int?` | - | ID member (⚠️ no FK) |
| `is_reply` | `Boolean?` | default: false | Apakah reply/balasan |
| `parent_comment_id` | `String?` | varchar(255) | ID parent comment |
| `partner_name` | `String?` | varchar(255) | Nama partner/akun yang di-comment |
| `partner_id` | `String?` | varchar(100) | ID partner |
| `submission_id` | `Int?` | - | ID submission terkait |

**Unique Constraint:** `(comment_id, partner_id)` — Satu komentar per partner

**Indexes:** `partner_id`, `(partner_name, comment_timestamp DESC)`

---

## 8. Instagram Tables

### 8.1 `media` — Instagram Media/Post

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `ig_media_id` | `String` | PK | Instagram media ID |
| `id` | `String` | - | ID internal |
| `caption` | `String?` | - | Caption post |
| `timestamp` | `DateTime` | - | Waktu post |
| `permalink` | `String?` | unique | URL post |
| `post_timestamp` | `DateTime?` | - | - |
| `source_profile_link` | `String?` | - | Link profil pemilik |
| `platform` | `String?` | varchar(50) | Platform |
| `rekomendasi_task` | `String?` | - | AI task recommendation |
| `rekomendasi_keyword` | `String?` | - | AI keyword recommendation |
| `ai_status` | `String?` | - | Status AI processing |
| `ai_attempts` | `Int?` | default: 0 | Jumlah percobaan AI |
| `caption_hash` | `String?` | - | Hash caption untuk dedup |
| `ai_updated_at` | `DateTime?` | - | Terakhir AI update |
| `ai_model` | `String?` | - | Model AI yang digunakan |

**Indexes:** `ai_status`, `(source_profile_link, post_timestamp DESC)`

### 8.2 `instagram_accounts` — Akun Instagram yang Dipantau

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `ig_business_account_id` | `String` | unique | IG Business Account ID |
| `ig_username` | `String?` | unique | Username IG |
| `ig_name` | `String?` | - | Nama display |
| `ig_followers` | `Int?` | - | Jumlah followers |
| `profile_picture_url` | `String?` | - | URL foto profil |
| `priority` | `String?` | default: "medium" | Priority scraping |
| `max_posts_limit` | `Int?` | default: 50 | Limit post yang di-scrape |
| `processing_order` | `Int?` | - | Urutan proses |
| `facebook_page_id` | `String?` | - | Linked FB Page |
| `page_access_token` | `String?` | - | Access token untuk API |
| `discovered_at` | `DateTime?` | default: now() | - |

### 8.3 `instagram_master_config` — Konfigurasi Master IG

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | - | ⚠️ No unique → `@@ignore` |
| `master_access_token` | `String` | - | Token utama |
| `discovery_enabled` | `Boolean?` | default: true | - |
| `last_discovery` | `DateTime?` | - | - |
| `total_ig_accounts_found` | `Int?` | - | - |
| `status` | `String?` | default: "active" | - |

**⚠️ `@@ignore`:** Tabel ini diabaikan Prisma karena tidak punya unique identifier.

---

## 9. Facebook Tables

### 9.1 `facebook_pages` — Halaman Facebook

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `facebook_page_id` | `String` | unique, varchar(255) | FB Page ID |
| `facebook_page_name` | `String?` | - | Nama page |
| `page_access_token` | `String?` | - | Access token |
| `priority` | `String?` | default: "medium" | Priority |
| `max_posts_limit` | `Int?` | default: 50 | - |
| `processing_order` | `Int?` | - | - |
| `page_name` | `String?` | - | Nama display |
| `page_username` | `String?` | - | Username page |
| `page_category` | `String?` | varchar(100) | Kategori |
| `page_followers_count` | `Int?` | - | Followers |
| `page_likes_count` | `Int?` | - | Likes |
| `page_link` | `String?` | varchar(500) | URL page |
| `is_active` | `Boolean?` | default: true | - |
| `last_processed` | `DateTime?` | - | Terakhir di-scrape |
| `created_at` | `DateTime?` | default: now() | - |
| `updated_at` | `DateTime?` | default: now() | - |

### 9.2 `facebook_posts` — Post Facebook

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `post_id` | `String` | unique, varchar(100) | FB Post ID |
| `facebook_page_id` | `String?` | FK → facebook_pages | - |
| `post_type` | `String?` | varchar(20) | Tipe post |
| `post_message` | `String?` | - | Isi post |
| `post_story` | `String?` | - | Story text |
| `post_link` | `String?` | varchar(1000) | URL lampiran |
| `permalink` | `String` | varchar(1000) | URL post |
| `created_time` | `DateTime` | - | Waktu dibuat |
| `updated_time` | `DateTime?` | - | Waktu diupdate |
| `likes_count` | `Int?` | default: 0 | Like |
| `comments_count` | `Int?` | default: 0 | Komentar |
| `shares_count` | `Int?` | default: 0 | Share |
| `reactions_*` | `Int?` | default: 0 | 6 tipe reaksi (like,love,wow,haha,sad,angry) |
| `is_published` | `Boolean?` | default: true | - |
| `rekomendasi_tugas` | `String?` | - | AI recommendation |
| `rekomendasi_keyword` | `String?` | - | AI keyword |

### 9.3 `facebook_comments` — Komentar Facebook

41 fields — tabel paling lengkap untuk komentar. Self-referencing (parent_comment_id).

Key fields: `comment_id`, `post_id`, `facebook_page_id`, `parent_comment_id`, `is_reply`, `comment_text`, `commenter_*`, `likes_count`, `replies_count`.

### 9.4 `facebook_execution_log` — Log Eksekusi Scraping

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `execution_id` | `String` | unique | ID eksekusi n8n |
| `started_at` | `DateTime?` | default: now() | - |
| `completed_at` | `DateTime?` | - | - |
| `total_pages_processed` | `Int?` | - | - |
| `total_posts_processed` | `Int?` | - | - |
| `total_comments_harvested` | `Int?` | - | - |
| `status` | `String?` | default: "running" | running/completed/error |
| `error_message` | `String?` | - | - |
| `processing_summary` | `Json?` | - | - |

### 9.5 `facebook_trigger_comment_queue` — Antrian Komentar Otomatis

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `status` | `String` | varchar(20) | pending/processing/done/failed |
| `target_post_id` | `String` | - | Post yang ditarget |
| `target_post_caption` | `String?` | - | Caption post |
| `posted_comment_id_1` | `String?` | - | ID komentar 1 yang diposting |
| `posted_comment_id_2` | `String?` | - | ID komentar 2 |
| `attempt_count` | `Int?` | default: 0 | Percobaan |
| `error_message` | `String?` | - | - |
| `created_at` | `DateTime?` | default: now() | - |
| `processed_at` | `DateTime?` | - | - |

---

## 10. TikTok Tables

### 10.1 `tiktok_contents` — Konten TikTok

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `content_id` | `String` | unique, varchar(255) | TikTok content ID |
| `author_username` | `String` | varchar(255) | Username pembuat |
| `author_nickname` | `String?` | varchar(255) | Nickname |
| `content_type` | `String?` | varchar(50) | Tipe konten |
| `description` | `String?` | - | Deskripsi/caption |
| `video_url` | `String?` | - | URL video |
| `cover_url` | `String?` | - | URL cover image |
| `like_count` | `Int?` | default: 0 | Likes |
| `comment_count` | `Int?` | default: 0 | Komentar |
| `share_count` | `Int?` | default: 0 | Share |
| `view_count` | `Int?` | default: 0 | Views |
| `created_at_tiktok` | `DateTime?` | - | Waktu dibuat di TikTok |
| `scraped_at` | `DateTime?` | default: now() | Waktu di-scrape |
| `updated_at` | `DateTime?` | - | Terakhir diupdate |
| `last_comment_scrape` | `DateTime?` | - | Terakhir scrape komentar |

**Indexes:** `author_username`, `created_at_tiktok`, `scraped_at`

---

## 11. DRW Integration Tables

### 11.1 `bc_drwskincare_api` — Data API DRW Skincare

Data Beauty Consultant dari DRW Skincare API.

| Field | Type | Deskripsi |
|-------|------|-----------|
| `id` | `String` | PK |
| `resellerId` | `String` | unique — ID reseller DRW |
| `apiResellerId` | `String` | ID dari API |
| `nama_reseller` | `String?` | Nama BC |
| `email_address` | `String?` | Email |
| `nomor_hp` / `nomorHp` | `String?` | Nomor HP (Ada 2 field!) |
| `whatsapp_number` | `String?` | WhatsApp |
| `level` | `String?` | Level BC di DRW |
| `area` / `provinsi` / `kabupaten` / `kecamatan` | `String?` | Wilayah |
| `facebook` / `instagram` | `String?` | Social media |
| `bank` / `rekening` | `String?` | Info rekening |
| `apiData` | `Json?` | Raw API response |
| `last_api_sync_at` | `DateTime?` | Terakhir sync dari API |
| `last_user_update` | `DateTime?` | Terakhir user update |

### 11.2 `bc_drwskincare_plus` — Koneksi BC ke Member

| Field | Type | Deskripsi |
|-------|------|-----------|
| `id` | `Int` | PK |
| `member_id` | `Int` | unique, FK → members |
| `reseller_id` | `String` | unique, FK → bc_drwskincare_api |
| `input_phone` | `String?` | Nomor HP yang diinput |
| `verification_status` | `String` | default: "pending" → verified |
| `verified_at` | `DateTime?` | Waktu verifikasi |

### 11.3 `bc_drwskincare_plus_verified` — Data Terverifikasi BC

Data BC yang sudah dikonfirmasi user + admin.

| Field | Type | Deskripsi |
|-------|------|-----------|
| `id` | `Int` | PK |
| `connection_id` | `Int?` | unique, FK → bc_drwskincare_plus (CASCADE) |
| `api_data_id` | `String?` | FK → bc_drwskincare_api |
| `nama` | `String` | Nama |
| `nomor_hp` | `String?` | HP |
| `instagram_link` / `facebook_link` / `tiktok_link` | `String?` | Social media links |
| `area` | `String?` | Area |
| `desa` / `kecamatan` / `kabupaten` / `propinsi` / `kode_pos` | `String?` | Detail alamat |
| `alamat_detail` | `String?` | Alamat lengkap |

### 11.4 `drwcorp_employees` — Karyawan DRW Corp

| Field | Type | Deskripsi |
|-------|------|-----------|
| `id` | `Int` | PK |
| `nama_lengkap` | `String` | Nama lengkap |
| `email` | `String` | unique — email karyawan |
| `divisi` | `String` | Divisi kerja |
| `member_id` | `Int?` | FK → members (SET NULL) |
| `matching_status` | `String` | default: "unmatched" — unmatched/matched/confirmed |
| `matching_confidence` | `Float?` | Skor kecocokan (0-1) |
| `matching_suggestions` | `Json?` | Saran pencocokan |
| `confirmed_at` | `DateTime?` | Waktu dikonfirmasi |
| `confirmed_by` | `String?` | Siapa yang konfirmasi |

---

## 12. Auth & Session Tables

### 12.1 `PlatformSession` — Sesi Login ⭐

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `String` | PK | UUID |
| `member_id` | `Int` | FK → members (CASCADE) | - |
| `platform` | `String` | - | "Berkomunitas", dll |
| `jwt_token` | `String` | - | Current access token |
| `refresh_token` | `String?` | - | Refresh token |
| `expires_at` | `DateTime` | - | Token expiry |
| `ip_address` | `String?` | - | IP address saat login |
| `user_agent` | `String?` | - | Browser user agent |
| `created_at` | `DateTime?` | default: now() | - |
| `last_activity_at` | `DateTime?` | default: now() | Terakhir aktif |

**Indexes:** `member_id`, `platform`, `expires_at`

### 12.2 `UserActivity` — Log Aktivitas

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `String` | PK | UUID |
| `member_id` | `Int` | FK → members (CASCADE) | - |
| `platform` | `String` | - | Platform |
| `activity_type` | `String` | - | Tipe aktivitas |
| `points_earned` | `Int?` | default: 0 | Poin yang didapat |
| `metadata` | `Json?` | default: `{}` | Data tambahan |
| `created_at` | `DateTime?` | default: now() | - |

**Indexes:** `member_id`, `platform`, `activity_type`, `created_at DESC`

### 12.3 `user_privileges` — Privilege User ⭐

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `member_id` | `Int?` | FK → members (CASCADE) | - |
| `clerk_id` | `String?` | varchar(255) | **LEGACY** |
| `privilege` | `String` | varchar(50) | "admin", "super_admin", "BerkomunitasPlus" |
| `is_active` | `Boolean` | default: true | Aktif? |
| `granted_at` | `DateTime` | default: now() | - |
| `granted_by` | `String?` | varchar(255) | Siapa yang memberikan |
| `expires_at` | `DateTime?` | - | Kedaluwarsa (null = permanent) |

**Indexes:** `privilege`, `member_id`

### 12.4 `RegisteredPlatform` — Platform Terdaftar

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `String` | PK | UUID |
| `name` | `String` | unique | Nama platform |
| `domain` | `String` | - | Domain platform |
| `api_key` | `String` | unique | API key |
| `is_active` | `Boolean?` | default: true | - |
| `allowed_origins` | `String[]` | default: `[]` | CORS origins |
| `metadata` | `Json?` | default: `{}` | - |

**Indexes:** `name`, `is_active`

---

## 13. Statistics & View Tables

Tabel-tabel ini kemungkinan database VIEW atau tabel yang diisi oleh scheduled job.

### 13.1 `statistik_global` — Statistik Global

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `nama_statistik` | `String` | PK, varchar(100) | Key: "total_seluruh_komentar", dll |
| `nilai_statistik` | `BigInt` | - | Nilai (BigInt untuk angka besar) |
| `terakhir_diupdate` | `DateTime?` | default: now() | - |

### 13.2 `statistik_harian` — Statistik Harian

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `tanggal` | `DateTime` | PK (date only) | Tanggal |
| `total_komentar_baru` | `Int?` | default: 0 | Komentar baru hari itu |
| `total_tugas_selesai` | `Int?` | default: 0 | Tugas selesai |
| `total_poin_diberikan` | `Int?` | default: 0 | Total poin |
| `total_member_baru` | `Int?` | default: 0 | Member baru |

### 13.3 `peringkat_member_comments` — Leaderboard Komentar

| Field | Type | Deskripsi |
|-------|------|-----------|
| `username_sosmed` | `String` | PK — Username sosmed |
| `peringkat` | `Int` | Peringkat |
| `nama_tampilan` | `String?` | Nama display |
| `jumlah_komentar` | `Int` | Total komentar |
| `terakhir_diupdate` | `DateTime?` | default: now() |

### 13.4 `peringkat_member_loyalty` — Leaderboard Loyalty

| Field | Type | Deskripsi |
|-------|------|-----------|
| `id_member` | `Int` | PK — Member ID |
| `peringkat` | `Int` | Peringkat |
| `nama_lengkap` | `String?` | Nama |
| `username_sosmed` | `String?` | Username |
| `total_loyalty_point` | `Int` | Total poin |
| `terakhir_diupdate` | `DateTime?` | default: now() |

### 13.5 `peringkat_tugas_populer` — Task Terpopuler

| Field | Type | Deskripsi |
|-------|------|-----------|
| `peringkat` | `Int` | PK |
| `id_tugas` | `Int` | ID tugas |
| `keyword_tugas` | `String?` | Keyword |
| `jumlah_pengerjaan` | `Int` | Total pengerjaan |
| `terakhir_diupdate` | `DateTime?` | default: now() |

### 13.6 `peringkat_sumber_tugas` — Sumber Tugas Populer

| Field | Type | Deskripsi |
|-------|------|-----------|
| `peringkat` | `Int` | PK |
| `source_profile_link` | `String` | Link profil sumber |
| `jumlah_komentar` | `Int` | Total komentar |
| `terakhir_diupdate` | `DateTime?` | default: now() |

---

## 14. System Tables

### 14.1 `event_settings` — Pengaturan Event

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `setting_name` | `String` | PK, varchar(100) | Nama setting |
| `setting_value` | `String?` | - | Nilai |
| `description` | `String?` | - | Deskripsi |
| `start_date` | `DateTime?` | - | Mulai event |
| `end_date` | `DateTime?` | - | Akhir event |

### 14.2 `system_logs` — Log Sistem

| Field | Type | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | `Int` | PK | - |
| `log_level` | `String?` | default: "INFO", varchar(20) | INFO/WARN/ERROR |
| `source` | `String?` | varchar(100) | Sumber log |
| `message` | `String?` | - | Pesan |
| `context` | `Json?` | - | Data tambahan |
| `created_at` | `DateTime?` | default: now() | - |

---

## 15. Business Rules & Invariants

### Aturan Coin & Loyalty

1. **coin ≤ loyalty_point** — SELALU. Coin tidak boleh melebihi loyalty point
2. **loyalty_point TIDAK PERNAH TURUN** — Hanya naik (permanent achievement)
3. **coin BISA TURUN** — Saat redeem reward (debit)
4. **Setiap penambahan loyalty_point, coin juga naik** — Auto-sync via CoinLoyaltyManager
5. **History harus selalu tercatat** — Setiap perubahan coin/loyalty harus buat record di history table

### Aturan Task

1. **Satu member = satu submission per task** — Enforced by unique constraint `(id_member, id_task)`
2. **Status flow submission:** `tersedia` → `dikerjakan` (klik) → `selesai` (verified) atau `gagal`
3. **Batas waktu** — Ada kolom `batas_waktu` tapi enforcement-nya belum konsisten
4. **Verifikasi bisa oleh n8n atau admin** — Field `verified_by` mencatat siapa

### Aturan Auth

1. **Access token = 7 hari expiry** — JWT
2. **Refresh token = 30 hari expiry** — JWT, disimpan di DB (PlatformSession)
3. **Session bisa multiple** — Satu member bisa login dari banyak device
4. **Privilege bisa expire** — Field `expires_at` di user_privileges (null = permanent)
5. **Admin = privilege 'admin' atau 'super_admin'** — Active dan not expired

### Aturan Reward

1. **Redeem menggunakan COIN (bukan loyalty_point)**
2. **Stock berkurang saat redeem**
3. **Beberapa reward butuh privilege** — Field `required_privilege` (misal: "BerkomunitasPlus")
4. **Status flow redemption:** `menunggu_verifikasi` → `diproses` → `dikirim` → `diterima`

---

## 16. Index Strategy

### Performance-Critical Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| `members` | `idx_members_email` | `email` | Login lookup |
| `members` | `idx_members_google_id` | `google_id` | SSO lookup |
| `members` | `idx_members_loyalty_point` | `loyalty_point` | Leaderboard sorting |
| `members` | `idx_members_coin` | `coin` | Balance queries |
| `coin_history` | `idx_coin_history_member_id` | `member_id` | History lookup |
| `coin_history` | `idx_coin_history_created_at` | `created_at` | Timeline queries |
| `task_submissions` | `status_submission` | `status_submission` | Filter by status |
| `tugas_ai_2_screenshots` | composite | `(tugas_ai_2_id, member_id)` | Check existing submission |
| `PlatformSession` | `idx_platform_session_member` | `member_id` | Session lookup |
| `PlatformSession` | `idx_platform_session_expires` | `expires_at` | Session cleanup |
| `UserActivity` | `idx_user_activity_created` | `created_at DESC` | Recent activity |

### Missing Indexes (Recommendation)

| Table | Recommended Index | Reason |
|-------|------------------|--------|
| `loyalty_point_history` | `member_id` | History lookup (currently no index) |
| `notifications` | `id_member, is_read` | Unread notification count |
| `reward_redemptions` | `id_member` | User's redemption history |
| `comments` | `id_task` | Task comment lookup |

---

> **Dokumen selanjutnya:** [DOCS_3_API_BACKEND.md](DOCS_3_API_BACKEND.md) — Detail lengkap 117 API endpoint dan library backend
