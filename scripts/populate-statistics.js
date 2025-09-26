// Script to populate statistik_global and statistik_harian tables with sample data
// Run: npx prisma generate && node scripts/populate-statistics.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Populate statistik_global
  const globalStats = [
    { nama_statistik: 'total_komentar', nilai_statistik: 12345n },
    { nama_statistik: 'total_tugas_selesai', nilai_statistik: 6789n },
    { nama_statistik: 'total_poin_diberikan', nilai_statistik: 54321n },
    { nama_statistik: 'total_member', nilai_statistik: 1000n },
  ];
  for (const stat of globalStats) {
    await prisma.statistik_global.upsert({
      where: { nama_statistik: stat.nama_statistik },
      update: { nilai_statistik: stat.nilai_statistik, terakhir_diupdate: new Date() },
      create: { ...stat, terakhir_diupdate: new Date() },
    });
  }

  // Populate statistik_harian (last 7 days)
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    await prisma.statistik_harian.upsert({
      where: { tanggal: date },
      update: {
        total_komentar_baru: 100 + i * 5,
        total_tugas_selesai: 50 + i * 2,
        total_poin_diberikan: 200 + i * 10,
        total_member_baru: 10 + i,
      },
      create: {
        tanggal: date,
        total_komentar_baru: 100 + i * 5,
        total_tugas_selesai: 50 + i * 2,
        total_poin_diberikan: 200 + i * 10,
        total_member_baru: 10 + i,
      },
    });
  }

  console.log('Sample statistics populated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
