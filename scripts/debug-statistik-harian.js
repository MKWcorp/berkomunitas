// Debug script: tampilkan isi tabel statistik_harian
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = await prisma.statistik_harian.findMany({ orderBy: { tanggal: 'desc' }, take: 10 });
  for (const row of data) {
    console.log(row);
  }
}

main().finally(() => prisma.$disconnect());
