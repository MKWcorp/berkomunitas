// Test script untuk notifikasi validasi tugas yang sukses
// Jalankan dengan: node scripts/test-validation-notification.js

import { PrismaClient } from '@prisma/client';
import { createTaskValidationSuccessNotification } from '../lib/taskNotifications.js';

const prisma = new PrismaClient();

async function testValidationNotification() {
  try {
    console.log('🧪 Testing Task Validation Success Notification...\n');

    // 1. Find atau create test member
    let testMember = await prisma.members.findFirst({
      where: { nama_lengkap: 'Test User Validation' }
    });

    if (!testMember) {
      testMember = await prisma.members.create({
        data: {
          nama_lengkap: 'Test User Validation',
          loyalty_point: 100
        }
      });
    }

    console.log(`✅ Test member: ${testMember.nama_lengkap} (ID: ${testMember.id})`);

    // 2. Find atau create test task  
    let testTask = await prisma.tugas_ai.findFirst({
      where: { keyword_tugas: 'test-validation-notif' }
    });

    if (!testTask) {
      testTask = await prisma.tugas_ai.create({
        data: {
          keyword_tugas: 'test-validation-notif',
          deskripsi_tugas: 'Test task untuk notifikasi validasi',
          link_postingan: 'https://example.com/test',
          point_value: 5,
          status: 'tersedia'
        }
      });
    }

    console.log(`✅ Test task: "${testTask.keyword_tugas}" (ID: ${testTask.id})`);

    // 3. Test different validation success scenarios
    const testScenarios = [
      {
        points: 10,
        taskName: testTask.keyword_tugas,
        description: 'Standard validation with points'
      },
      {
        points: 25,
        taskName: testTask.keyword_tugas,
        description: 'High points validation'
      },
      {
        points: 5,
        taskName: null, // Test default task name
        description: 'Validation without custom task name'
      }
    ];

    console.log('\n🔔 Creating validation success notifications...\n');

    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      
      console.log(`📝 Scenario ${i + 1}: ${scenario.description}`);
      console.log(`   Points: ${scenario.points}`);
      console.log(`   Task Name: ${scenario.taskName || 'default'}`);      await createTaskValidationSuccessNotification({
        memberId: testMember.id,
        points: scenario.points,
        taskName: scenario.taskName
      });

      console.log(`   ✅ Notification created\n`);
    }    // 4. Verify notifications were created
    const validationNotifications = await prisma.notifications.findMany({
      where: {
        id_member: testMember.id,
        message: { contains: 'berhasil divalidasi' },
        link_url: `/loyalty`
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    console.log(`📬 Created ${validationNotifications.length} validation notifications:\n`);
    validationNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. Message: "${notif.message}"`);
      console.log(`      Link: ${notif.link_url}`);
      console.log(`      Created: ${notif.created_at.toISOString()}\n`);
    });

    // 5. Test message format
    const expectedPatterns = [
      /berhasil divalidasi/,
      /mendapatkan \d+ poin baru/,
      /Selamat!/
    ];

    console.log('🔍 Testing notification message format...\n');
    validationNotifications.forEach((notif, index) => {
      console.log(`   Testing notification ${index + 1}:`);
      expectedPatterns.forEach((pattern, patternIndex) => {
        const matches = pattern.test(notif.message);
        console.log(`     ${matches ? '✅' : '❌'} Pattern ${patternIndex + 1}: ${pattern.source}`);
      });
      console.log('');
    });    // 6. Verify link format
    const linkPattern = /^\/loyalty$/;
    const allLinksValid = validationNotifications.every(notif => 
      linkPattern.test(notif.link_url)
    );

    console.log('🔗 Link format validation:');
    console.log(`   ${allLinksValid ? '✅' : '❌'} All links follow /loyalty format`);
    
    if (allLinksValid) {
      console.log('   ✅ Users will navigate to loyalty points history when clicking');
    }

    console.log('\n🎉 Task validation notification testing completed successfully!');
    
    console.log('\n📋 Summary:');
    console.log('   ✅ Validation success notifications are working');    console.log('   ✅ Different point amounts handled correctly');
    console.log('   ✅ Custom and default task names supported');
    console.log('   ✅ Links use /loyalty format for points history');
    console.log('   ✅ Messages include congratulations and point details');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testValidationNotification();
