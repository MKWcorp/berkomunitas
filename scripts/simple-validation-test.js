// Simple test for validation notification
const { PrismaClient } = require('@prisma/client');

async function simpleTest() {
  console.log('🧪 Simple validation notification test...');
  
  try {
    const prisma = new PrismaClient();
    
    // Test import of the function
    const { createTaskValidationSuccessNotification } = require('../lib/taskNotifications.js');
    
    console.log('✅ Successfully imported createTaskValidationSuccessNotification');
    
    // Find a test member and task
    const member = await prisma.members.findFirst();
    const task = await prisma.tugas_ai.findFirst();
    
    if (!member || !task) {
      console.log('❌ No test data found. Need at least one member and one task.');
      return;
    }
      console.log(`📝 Testing with member: ${member.nama_lengkap} (ID: ${member.id})`);
    console.log(`📝 Testing with task: ${task.keyword_tugas} (ID: ${task.id})`);
    
    // Create test notification
    await createTaskValidationSuccessNotification({
      memberId: member.id,
      points: 15,
      taskName: task.keyword_tugas
    });
    
    console.log('✅ Validation notification created successfully!');
    
    // Check if notification was created
    const notification = await prisma.notifications.findFirst({
      where: {
        id_member: member.id,
        message: { contains: 'berhasil divalidasi' }
      },
      orderBy: { created_at: 'desc' }
    });
    
    if (notification) {
      console.log('✅ Notification found in database:');
      console.log(`   Message: "${notification.message}"`);
      console.log(`   Link: ${notification.link_url}`);
    } else {
      console.log('❌ Notification not found in database');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

simpleTest();
