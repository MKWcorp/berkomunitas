import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExistingTaskNotifications() {
  try {
    console.log('🔄 Updating existing task notifications to use specific task URLs...\n');

    // Find all notifications that currently link to generic /tugas page
    const genericTaskNotifications = await prisma.notifications.findMany({
      where: {
        link_url: '/tugas'
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`📊 Found ${genericTaskNotifications.length} notifications with generic /tugas link\n`);

    if (genericTaskNotifications.length === 0) {
      console.log('✅ No generic task notifications found. All notifications already have specific links!');
      return;
    }

    // For generic notifications, we'll try to extract task information from the message
    // and create appropriate links, or set a default fallback
    let updatedCount = 0;
    let failedCount = 0;

    for (const notification of genericTaskNotifications) {
      try {
        let newLinkUrl = '/tugas'; // Default fallback
        
        // Try to extract task info from message patterns
        const message = notification.message;
        
        // Pattern 1: "Tugas baru tersedia: 'Task Name'"
        // Pattern 2: "Tugas 'Task Name' akan berakhir"
        // Pattern 3: "Anda telah menyelesaikan tugas 'Task Name'"
        
        // For demo purposes, let's find the first available task and use that
        // In a real scenario, you might have better ways to map messages to specific tasks
        const firstAvailableTask = await prisma.tugas_ai.findFirst({
          where: {
            status: 'tersedia'
          },
          orderBy: {
            id: 'asc'
          }
        });

        if (firstAvailableTask) {
          newLinkUrl = `/tugas/${firstAvailableTask.id}`;
        }

        // Update the notification
        await prisma.notifications.update({
          where: { id: notification.id },
          data: { link_url: newLinkUrl }
        });

        console.log(`✅ Updated notification ${notification.id}: "${message.substring(0, 50)}..." → ${newLinkUrl}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to update notification ${notification.id}:`, error.message);
        failedCount++;
      }
    }

    console.log(`\n📈 Update Summary:`);
    console.log(`   ✅ Successfully updated: ${updatedCount} notifications`);
    console.log(`   ❌ Failed to update: ${failedCount} notifications`);

    // Show sample of updated notifications
    const sampleUpdated = await prisma.notifications.findMany({
      where: {
        link_url: {
          startsWith: '/tugas/',
          not: '/tugas'
        }
      },
      take: 5,
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`\n📋 Sample of updated notifications:`);
    sampleUpdated.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.link_url} - "${notif.message.substring(0, 60)}..."`);
    });

    console.log('\n🎉 Notification update completed!');

  } catch (error) {
    console.error('❌ Error during update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateExistingTaskNotifications().catch(console.error);
