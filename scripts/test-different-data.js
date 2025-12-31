/**
 * Alternative test with different data
 * Testing with a different member and task
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWithDifferentData() {
  console.log('🧪 Testing with different member and task...\n');

  try {
    // Get different test data
    const members = await prisma.members.findMany({
      where: { google_id: { not: null } },
      select: { id: true, nama_lengkap: true },
      take: 3
    });

    const tasks = await prisma.tugas_ai.findMany({
      where: { status: 'tersedia' },
      select: { id: true, keyword_tugas: true, link_postingan: true },
      take: 3
    });

    console.log('Available members:', members);
    console.log('Available tasks:', tasks);

    // Test with different combinations
    for (let i = 0; i < Math.min(2, members.length, tasks.length); i++) {
      const member = members[i];
      const task = tasks[i];
      
      console.log(`\n🔄 Testing ${i + 1}: Member ${member.id}, Task ${task.id}`);
      
      // Clean up existing submissions
      await prisma.task_submissions.deleteMany({
        where: { id_member: member.id, id_task: task.id }
      });

      const webhookUrl = `https://n8n.drwapp.com/webhook/4a7f7831-77d7-44d5-8ced-c842bfd479db?memberId=${member.id}&taskId=${task.id}`;
      console.log(`   Webhook: ${webhookUrl}`);

      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(webhookUrl, {
          method: 'GET',
          redirect: 'manual'
        });

        console.log(`   Status: ${response.status}`);
        
        if (response.status === 302 || response.status === 301) {
          console.log(`   ✅ Redirect to: ${response.headers.get('location')}`);
        } else {
          const body = await response.text();
          console.log(`   Body: ${body.substring(0, 100)}...`);
        }

        // Check database
        await new Promise(resolve => setTimeout(resolve, 1000));
        const submission = await prisma.task_submissions.findFirst({
          where: { id_member: member.id, id_task: task.id }
        });

        if (submission) {
          console.log(`   ✅ Submission created: ${submission.status_submission}`);
        } else {
          console.log(`   ❌ No submission found`);
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWithDifferentData();
