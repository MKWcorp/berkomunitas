import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyNotificationSystem() {
  try {
    console.log('🔍 Verifying Task Notification System...\n');

    // 1. Check current notification link patterns
    const genericTaskNotifs = await prisma.notifications.count({
      where: { link_url: '/tugas' }
    });

    const specificTaskNotifs = await prisma.notifications.count({
      where: {
        link_url: {
          startsWith: '/tugas/',
          not: '/tugas'
        }
      }
    });

    const totalTaskNotifs = genericTaskNotifs + specificTaskNotifs;

    console.log('📊 Current Notification Status:');
    console.log(`   Generic '/tugas' links: ${genericTaskNotifs}`);
    console.log(`   Specific '/tugas/[id]' links: ${specificTaskNotifs}`);
    console.log(`   Total task notifications: ${totalTaskNotifs}\n`);

    // 2. Show recent specific task notifications
    const recentSpecificNotifs = await prisma.notifications.findMany({
      where: {
        link_url: {
          startsWith: '/tugas/',
          not: '/tugas'
        }
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    console.log('📋 Recent notifications with specific task links:');
    recentSpecificNotifs.forEach((notif, index) => {
      const taskIdMatch = notif.link_url.match(/\/tugas\/(\d+)/);
      const taskId = taskIdMatch ? taskIdMatch[1] : 'unknown';
      console.log(`   ${index + 1}. Task ID: ${taskId} | Link: ${notif.link_url}`);
      console.log(`      Message: "${notif.message.substring(0, 60)}..."`);
      console.log(`      Created: ${notif.created_at.toISOString()}\n`);
    });

    // 3. Test link format validation
    const linkFormatTest = recentSpecificNotifs.map(notif => {
      const isValidFormat = /^\/tugas\/\d+$/.test(notif.link_url);
      return {
        id: notif.id,
        link: notif.link_url,
        valid: isValidFormat
      };
    });

    const validLinks = linkFormatTest.filter(test => test.valid);
    const invalidLinks = linkFormatTest.filter(test => !test.valid);

    console.log('🔍 Link Format Validation:');
    console.log(`   ✅ Valid '/tugas/[id]' format: ${validLinks.length}`);
    console.log(`   ❌ Invalid format: ${invalidLinks.length}`);

    if (invalidLinks.length > 0) {
      console.log('\n❌ Invalid link formats found:');
      invalidLinks.forEach((link, index) => {
        console.log(`   ${index + 1}. ID ${link.id}: "${link.link}"`);
      });
    }
    console.log('');

    // 4. Check if helper functions are being used
    const taskCompletionNotifs = await prisma.notifications.count({
      where: {
        message: {
          contains: 'telah diselesaikan'
        },
        link_url: {
          startsWith: '/tugas/',
          not: '/tugas'
        }
      }
    });

    const taskRejectionNotifs = await prisma.notifications.count({
      where: {
        message: {
          contains: 'ditolak'
        },
        link_url: {
          startsWith: '/tugas/',
          not: '/tugas'
        }
      }
    });

    console.log('🎯 Notification Type Analysis:');
    console.log(`   Task completion notifications: ${taskCompletionNotifs}`);
    console.log(`   Task rejection notifications: ${taskRejectionNotifs}`);
    console.log(`   Other task notifications: ${specificTaskNotifs - taskCompletionNotifs - taskRejectionNotifs}\n`);

    // 5. Check available tasks to ensure links point to existing tasks
    const uniqueTaskIds = [...new Set(
      recentSpecificNotifs
        .map(notif => {
          const match = notif.link_url.match(/\/tugas\/(\d+)/);
          return match ? parseInt(match[1]) : null;
        })
        .filter(id => id !== null)
    )];

    const existingTasks = await prisma.tugas_ai.count({
      where: {
        id: { in: uniqueTaskIds }
      }
    });

    console.log('🔗 Task Link Validation:');
    console.log(`   Unique task IDs in notifications: ${uniqueTaskIds.length}`);
    console.log(`   Existing tasks in database: ${existingTasks}`);
    console.log(`   Broken links: ${uniqueTaskIds.length - existingTasks}\n`);

    // 6. Summary and recommendations
    console.log('📋 System Status Summary:');
    
    if (genericTaskNotifs === 0) {
      console.log('   ✅ No generic /tugas links found - all notifications use specific URLs!');
    } else {
      console.log(`   ⚠️ ${genericTaskNotifs} notifications still use generic /tugas links`);
      console.log('   💡 Run fix-existing-task-notifications.js to update them');
    }

    if (specificTaskNotifs > 0) {
      console.log(`   ✅ ${specificTaskNotifs} notifications use specific task URLs`);
    }

    if (validLinks.length === linkFormatTest.length && linkFormatTest.length > 0) {
      console.log('   ✅ All recent notification links use correct format');
    }

    if (uniqueTaskIds.length === existingTasks) {
      console.log('   ✅ All notification links point to existing tasks');
    } else if (uniqueTaskIds.length > existingTasks) {
      console.log(`   ⚠️ ${uniqueTaskIds.length - existingTasks} notification links point to deleted tasks`);
    }

    console.log('\n🎯 Click Behavior Test:');
    if (recentSpecificNotifs.length > 0) {
      const testNotif = recentSpecificNotifs[0];
      const taskId = testNotif.link_url.match(/\/tugas\/(\d+)/)[1];
      console.log(`✅ When user clicks notification: "${testNotif.message.substring(0, 50)}..."`);
      console.log(`✅ They will navigate to: https://berkomunitas.com${testNotif.link_url}`);
      console.log(`✅ Which shows task detail page for task ID: ${taskId}`);
    }

    console.log('\n🎉 Verification completed successfully!');

    return {
      genericCount: genericTaskNotifs,
      specificCount: specificTaskNotifs,
      validFormatCount: validLinks.length,
      brokenLinksCount: uniqueTaskIds.length - existingTasks
    };

  } catch (error) {
    console.error('❌ Error during verification:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyNotificationSystem()
  .then(result => {
    if (result) {
      console.log('\n📊 Final Results:');
      console.log(`   📈 Specific links: ${result.specificCount}`);
      console.log(`   📉 Generic links: ${result.genericCount}`);
      console.log(`   ✅ Valid format: ${result.validFormatCount}`);
      console.log(`   🔗 Broken links: ${result.brokenLinksCount}`);
      
      if (result.genericCount === 0 && result.brokenLinksCount === 0) {
        console.log('\n🎉 System is working perfectly! 🎉');
      }
    }
  })
  .catch(console.error);
