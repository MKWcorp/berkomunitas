const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeSimpleRanking() {
  try {
    console.log('🎯 Analyzing Simple DRW Corp Ranking System...\n');

    // 1. Count badge holders
    const drwCorpBadge = await prisma.badges.findFirst({
      where: { badge_name: 'DRW Corp' }
    });

    const badgeHoldersCount = await prisma.member_badges.count({
      where: { id_badge: drwCorpBadge.id }
    });

    // 2. Count total employees from the list 
    const fs = require('fs');
    const employeesPath = 'src/utils/drwcorp-employees.js';
    const content = fs.readFileSync(employeesPath, 'utf8');
    
    // Count lines that are employee names
    const lines = content.split('\n');
    let totalEmployees = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("'") && trimmed.endsWith("',")) {
        totalEmployees++;
      }
    }

    console.log('📊 SIMPLE RANKING DISTRIBUTION:');
    console.log('=====================================');
    console.log(`👥 Badge Holders (Ranks 1-${badgeHoldersCount}): ${badgeHoldersCount} orang`);
    console.log(`⛓️  ALL DRW Corp Employees (Ranks ${badgeHoldersCount + 1}-${badgeHoldersCount + totalEmployees}): ${totalEmployees} orang`);
    console.log(`📈 Total Displayed: ${badgeHoldersCount + totalEmployees} / 155 positions`);
    console.log(`📋 Available Slots: ${155 - (badgeHoldersCount + totalEmployees)} positions`);
    console.log('=====================================\n');

    console.log('🎨 DISPLAY FORMAT:');
    console.log('=====================================');
    console.log(`🏆 Ranks 1-${badgeHoldersCount}: "Name.. : (points)" - Badge holders`);
    console.log(`⛓️  Ranks ${badgeHoldersCount + 1}-${badgeHoldersCount + totalEmployees}: "Full Employee Name" - All employees`);
    console.log('=====================================\n');

    console.log('⚡ KEY DIFFERENCES FROM PREVIOUS SYSTEM:');
    console.log('• NO DUPLICATION FILTERING');
    console.log('• ALL 53 employees will be displayed');
    console.log('• Some names might appear twice (badge holder + employee list)');
    console.log('• Simple logic: Badge holders first, then ALL employees');

    // Get badge holder names for reference
    const badgeHolders = await prisma.member_badges.findMany({
      where: { id_badge: drwCorpBadge.id },
      include: {
        members: { select: { nama_lengkap: true } }
      },
      take: 10 // Just first 10 for display
    });

    console.log('\n📋 Sample Badge Holder Names:');
    badgeHolders.forEach((item, index) => {
      console.log(`${index + 1}. ${item.members.nama_lengkap}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeSimpleRanking();
