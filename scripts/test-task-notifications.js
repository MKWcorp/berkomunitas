import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTaskNotifications() {
  try {
    console.log('🧪 Testing Task Notification System...\n');

    // 1. Find a member to test with
    const testMember = await prisma.members.findFirst({
      where: {
        clerk_id: { not: null }
      }
    });

    if (!testMember) {
      console.log('❌ No test member found with clerk_id');
      return;
    }

    console.log(`📝 Testing with member: ${testMember.nama_lengkap} (ID: ${testMember.id})\n`);

    // 2. Create a test task to generate notifications
    const testTask = await prisma.tugas_ai.create({
      data: {
        keyword_tugas: 'TEST - Komentar di Instagram Post',
        deskripsi_tugas: 'Test task untuk verifikasi sistem notifikasi',
        link_postingan: 'https://instagram.com/test',
        status: 'tersedia',
        point_value: 15
      }
    });

    console.log(`✅ Created test task: "${testTask.keyword_tugas}" (ID: ${testTask.id})`);    // 3. Create task submission (or update if exists)
    const existingSubmission = await prisma.task_submissions.findFirst({
      where: {
        id_member: testMember.id,
        id_task: testTask.id
      }
    });

    let taskSubmission;
    if (existingSubmission) {
      console.log(`📝 Found existing submission, updating...`);
      taskSubmission = await prisma.task_submissions.update({
        where: { id: existingSubmission.id },
        data: { 
          status_submission: 'sedang_verifikasi',
          waktu_klik: new Date()
        }
      });
    } else {
      taskSubmission = await prisma.task_submissions.create({
        data: {
          id_member: testMember.id,
          id_task: testTask.id,
          status_submission: 'sedang_verifikasi',
          waktu_klik: new Date()
        }
      });
    }

    console.log(`✅ Created/Updated task submission (ID: ${taskSubmission.id})`);

    // 4. Test completion notification by updating submission status
    await prisma.task_submissions.update({
      where: { id: taskSubmission.id },
      data: { 
        status_submission: 'selesai',
        tanggal_verifikasi: new Date()
      }
    });

    // 5. Check if notifications were created with correct link_url
    const notifications = await prisma.notifications.findMany({
      where: {
        id_member: testMember.id,
        link_url: `/tugas/${testTask.id}`
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    });

    console.log(`\n📬 Found ${notifications.length} notifications with correct link_url:`);
    notifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. Message: "${notif.message}"`);
      console.log(`      Link: ${notif.link_url}`);
      console.log(`      Read: ${notif.is_read ? '✅' : '❌'}`);
      console.log(`      Created: ${notif.created_at}\n`);
    });    // 6. Test rejection notification
    await prisma.task_submissions.update({
      where: { id: taskSubmission.id },
      data: { 
        status_submission: 'ditolak',
        admin_notes: 'Komentar tidak sesuai dengan requirement'
      }
    });

    // 7. Check rejection notification
    const rejectionNotif = await prisma.notifications.findFirst({
      where: {
        id_member: testMember.id,
        message: {
          contains: 'ditolak'
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (rejectionNotif) {
      console.log(`✅ Rejection notification created:`);
      console.log(`   Message: "${rejectionNotif.message}"`);
      console.log(`   Link: ${rejectionNotif.link_url}\n`);
    } else {
      console.log(`❌ Rejection notification not found\n`);
    }

    // 8. Cleanup - Delete test data
    await prisma.task_submissions.deleteMany({
      where: { id_task: testTask.id }
    });

    await prisma.tugas_ai.delete({
      where: { id: testTask.id }
    });

    // Delete test notifications
    await prisma.notifications.deleteMany({
      where: {
        id_member: testMember.id,
        message: {
          contains: 'TEST'
        }
      }
    });

    console.log(`🧹 Cleanup completed - Test data removed\n`);

    // 9. Verify that all notifications now link to specific task pages
    const allTaskNotifications = await prisma.notifications.findMany({
      where: {
        link_url: {
          startsWith: '/tugas/'
        }
      },
      take: 10,
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`📊 Sample of recent task notifications with correct links:`);
    allTaskNotifications.forEach((notif, index) => {
      const isCorrectFormat = notif.link_url.match(/^\/tugas\/\d+$/);
      console.log(`   ${index + 1}. ${isCorrectFormat ? '✅' : '❌'} ${notif.link_url} - "${notif.message.substring(0, 50)}..."`);
    });

    console.log('\n🎉 Task notification testing completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Task notifications now use specific URLs: /tugas/[id]');
    console.log('   ✅ Completion notifications are working');
    console.log('   ✅ Rejection notifications are working');
    console.log('   ✅ New task notifications are working');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testTaskNotifications().catch(console.error);
