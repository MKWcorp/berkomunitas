-- Migration untuk menambahkan kolom coin ke tabel members
-- dan mengisi nilai awal berdasarkan loyalty_point yang sudah ada

-- Tambah kolom coin dengan default value 0
ALTER TABLE "members" ADD COLUMN "coin" INTEGER NOT NULL DEFAULT 0;

-- Set nilai coin sama dengan loyalty_point untuk semua member yang sudah ada
UPDATE "members" SET "coin" = "loyalty_point";

-- Tambahkan comment untuk dokumentasi
COMMENT ON COLUMN "members"."coin" IS 'Koin yang dapat dibelanjakan untuk menukar hadiah';
COMMENT ON COLUMN "members"."loyalty_point" IS 'Poin loyalitas yang tidak berkurang, menunjukkan total kontribusi member';

-- Optional: Buat index untuk performa query yang berhubungan dengan coin
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_members_coin" ON "members" ("coin");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_members_loyalty_point" ON "members" ("loyalty_point");
