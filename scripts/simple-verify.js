const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyNotificationSystem() {
  try {
    console.log('🔍 Verifying Task Notification System...\n');

    // Check notification counts
    const genericCount = await prisma.notifications.count({
      where: { link_url: '/tugas' }
    });

    const specificCount = await prisma.notifications.count({
      where: {
        link_url: {
          startsWith: '/tugas/',
          not: '/tugas'
        }
      }
    });

    console.log('📊 Notification Counts:');
    console.log(`   Generic /tugas links: ${genericCount}`);
    console.log(`   Specific /tugas/[id] links: ${specificCount}`);

    // Get recent specific notifications
    const recentNotifs = await prisma.notifications.findMany({
      where: {
        link_url: {
          startsWith: '/tugas/',
          not: '/tugas'
        }
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    console.log('\n📋 Recent specific task notifications:');
    recentNotifs.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.link_url} - "${notif.message.substring(0, 50)}..."`);
    });

    console.log('\n✅ System Status:');
    if (genericCount === 0) {
      console.log('   ✅ All task notifications use specific URLs!');
    } else {
      console.log(`   ⚠️ ${genericCount} notifications still need updating`);
    }

    if (specificCount > 0) {
      console.log(`   ✅ ${specificCount} notifications correctly use /tugas/[id] format`);
      console.log('   ✅ Users will navigate to specific task detail pages when clicking');
    }

    console.log('\n🎉 Verification completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNotificationSystem();
