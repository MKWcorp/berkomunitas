import { PrismaClient } from '@prisma/client';
import { createRewardRedemptionNotification, createRewardStatusNotification } from './lib/rewardNotifications.js';

const prisma = new PrismaClient();

async function testRewardNotifications() {
  try {
    console.log('🧪 Testing Reward Notification System...\n');

    // Get a sample member for testing
    const sampleMember = await prisma.members.findFirst({
      where: {
        nama_lengkap: { not: null }
      },
      select: {
        id: true,
        nama_lengkap: true,
        coin: true
      }
    });

    if (!sampleMember) {
      console.log('❌ No members found for testing');
      return;
    }

    console.log(`📋 Using member: ${sampleMember.nama_lengkap} (ID: ${sampleMember.id})\n`);

    // Test 1: Reward redemption notification
    console.log('🔔 Test 1: Creating reward redemption notification...');
    await createRewardRedemptionNotification({
      memberId: sampleMember.id,
      rewardName: 'Testing Reward T-Shirt'
    });

    // Verify redemption notification was created
    const redemptionNotif = await prisma.notifications.findFirst({
      where: {
        id_member: sampleMember.id,
        message: { contains: 'Testing Reward T-Shirt' }
      },
      orderBy: { created_at: 'desc' }
    });

    if (redemptionNotif) {
      console.log('✅ Redemption notification created successfully!');
      console.log(`   Message: "${redemptionNotif.message}"`);
      console.log(`   Link: ${redemptionNotif.link_url}\n`);
    } else {
      console.log('❌ Redemption notification not found\n');
    }

    // Test 2: Status update notifications
    const statusTests = [
      { status: 'dikirim', expectedMessage: 'Testing Reward Mug sedang dikirim' },
      { status: 'diterima', expectedMessage: 'Testing Reward Mug sudah diterima' },
      { status: 'ditolak', expectedMessage: 'Penukaran Testing Reward Mug anda Ditolak, Coin anda Senilai 50 Dikembalikan' }
    ];

    for (let i = 0; i < statusTests.length; i++) {
      const test = statusTests[i];
      console.log(`🔔 Test ${i + 2}: Creating ${test.status} status notification...`);
      
      await createRewardStatusNotification({
        memberId: sampleMember.id,
        rewardName: 'Testing Reward Mug',
        status: test.status,
        coinRefund: test.status === 'ditolak' ? 50 : 0
      });

      // Verify notification was created
      const statusNotif = await prisma.notifications.findFirst({
        where: {
          id_member: sampleMember.id,
          message: { contains: 'Testing Reward Mug' }
        },
        orderBy: { created_at: 'desc' }
      });

      if (statusNotif) {
        console.log('✅ Status notification created successfully!');
        console.log(`   Message: "${statusNotif.message}"`);
        console.log(`   Expected: "${test.expectedMessage}"`);
        console.log(`   Link: ${statusNotif.link_url}\n`);
      } else {
        console.log('❌ Status notification not found\n');
      }
    }

    // Test 3: Show recent notifications for this member
    console.log('📋 Recent reward notifications for this member:');
    const recentNotifs = await prisma.notifications.findMany({
      where: {
        id_member: sampleMember.id,
        message: { contains: 'Testing Reward' }
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    recentNotifs.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.is_read ? '✅' : '📬'} ${notif.message}`);
      console.log(`   Created: ${notif.created_at.toISOString()}`);
    });

    console.log(`\n🎉 Testing completed! Created ${recentNotifs.length} test notifications.`);

    // Cleanup test notifications
    console.log('\n🧹 Cleaning up test notifications...');
    const deleted = await prisma.notifications.deleteMany({
      where: {
        id_member: sampleMember.id,
        message: { contains: 'Testing Reward' }
      }
    });
    console.log(`✅ Deleted ${deleted.count} test notifications`);

  } catch (error) {
    console.error('❌ Error testing reward notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRewardNotifications().catch(console.error);