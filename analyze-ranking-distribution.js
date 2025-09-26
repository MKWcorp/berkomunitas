const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeRankingDistribution() {
  try {
    console.log('🔍 Menganalisis Distribusi Ranking DRW Corp...\n');

    // 1. Hitung member dengan badge DRW Corp
    const drwCorpBadge = await prisma.badges.findFirst({
      where: { badge_name: 'DRW Corp' }
    });

    if (!drwCorpBadge) {
      console.log('❌ DRW Corp badge tidak ditemukan');
      return;
    }

    const badgeHoldersCount = await prisma.member_badges.count({
      where: { id_badge: drwCorpBadge.id }
    });

    // 2. Hitung total karyawan DRW Corp dari list
    const fs = require('fs');
    const path = require('path');
    const employeesPath = path.join(__dirname, 'src/utils/drwcorp-employees.js');
    const employeesContent = fs.readFileSync(employeesPath, 'utf8');

    // Extract employee names from the array - count only lines that start with spaces and quotes
    const lines = employeesContent.split('\n');
    let totalEmployees = 0;
    for (const line of lines) {
      if (line.trim().startsWith("'") && line.trim().endsWith("',")) {
        totalEmployees++;
      }
    }

    console.log('📊 DISTRIBUSI RANKING BARU:');
    console.log('=====================================');
    console.log(`👥 Member dengan Badge DRW Corp: ${badgeHoldersCount} orang`);
    console.log(`🏢 Total Karyawan DRW Corp: ${totalEmployees} orang`);
    console.log(`📈 Total Ranking Terisi: ${badgeHoldersCount + totalEmployees} posisi`);
    console.log('=====================================\n');

    console.log('🎯 DETAIL DISTRIBUSI:');
    console.log('=====================================');

    // Rank 1-65: Member dengan badge
    console.log(`🏆 Rank 1-${Math.min(65, badgeHoldersCount)}: Member dengan badge DRW Corp`);
    console.log(`   Format: "Nama.. : (poin)"`);
    console.log(`   Jumlah: ${Math.min(65, badgeHoldersCount)} orang\n`);

    // Rank 66+: Karyawan DRW Corp
    const slaveStartRank = Math.min(66, badgeHoldersCount + 1);
    const slaveEndRank = badgeHoldersCount + totalEmployees;
    console.log(`⛓️  Rank ${slaveStartRank}-${slaveEndRank}: Karyawan DRW Corp`);
    console.log(`   Format: Nama lengkap tanpa poin`);
    console.log(`   Jumlah: ${totalEmployees} orang\n`);

    // Slot kosong
    const totalCapacity = 155;
    const usedSlots = badgeHoldersCount + totalEmployees;
    const emptySlots = Math.max(0, totalCapacity - usedSlots);

    console.log(`📋 RINGKASAN:`);
    console.log(`   • Kapasitas total: ${totalCapacity} posisi`);
    console.log(`   • Terisi: ${usedSlots} posisi`);
    console.log(`   • Kosong: ${emptySlots} posisi`);
    console.log(`   • Tingkat pengisian: ${((usedSlots/totalCapacity)*100).toFixed(1)}%\n`);

    console.log('🎨 HIERARKI TIER:');
    console.log('=====================================');
    console.log('🏆 MIGHTY (Rank 1-3)     - Gold #F8C600');
    console.log('🛡️ GUARD (Rank 4-8)      - Light Gold #F7DA6A');
    console.log('👑 SERVANT (Rank 9-20)    - White #FFFFFF');
    console.log('👥 COMMONERS (Rank 21-30) - Light Pink #FFD4D4');
    console.log('😈 FREEPY (Rank 31-40)    - Pink #FF9D9D');
    console.log('😈 LOWLY (Rank 41-50)     - Red #FF6969');
    console.log('💀 FORMER (Rank 51-65)    - Dark Red #FF5252');
    console.log('⛓️ SLAVE (Rank 66+)       - Bright Red #FF0000');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeRankingDistribution();
