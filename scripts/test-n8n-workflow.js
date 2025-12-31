/**
 * Test script for N8N Webhook Integration
 * Tests the complete flow: Task Start -> N8N Webhook -> Database Update -> Redirect
 * 
 * Run with: node scripts/test-n8n-workflow.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testN8NWorkflow() {
  console.log('🧪 Testing N8N Workflow Integration...\n');

  try {
    // 1. Get a sample member and task from database
    console.log('📋 Step 1: Getting test data from database...');
    
    const member = await prisma.members.findFirst({
      where: { google_id: { not: null } },
      select: { id: true, nama_lengkap: true, google_id: true }
    });

    const task = await prisma.tugas_ai.findFirst({
      where: { status: 'tersedia' },
      select: { 
        id: true, 
        keyword_tugas: true, 
        deskripsi_tugas: true,
        link_postingan: true, 
        point_value: true 
      }
    });

    if (!member || !task) {
      console.log('❌ Test data not found:');
      console.log('   Member found:', !!member);
      console.log('   Task found:', !!task);
      return;
    }

    console.log('✅ Test data found:');
    console.log(`   Member: ${member.nama_lengkap} (ID: ${member.id})`);
    console.log(`   Task: ${task.keyword_tugas || task.deskripsi_tugas} (ID: ${task.id})`);
    console.log(`   Post URL: ${task.link_postingan}\n`);

    // 2. Check if there's an existing submission
    console.log('📋 Step 2: Checking existing submissions...');
    
    const existingSubmission = await prisma.task_submissions.findFirst({
      where: {
        id_member: member.id,
        id_task: task.id
      }
    });

    if (existingSubmission) {
      console.log('⚠️  Existing submission found, cleaning up...');
      await prisma.task_submissions.deleteMany({
        where: {
          id_member: member.id,
          id_task: task.id
        }
      });
      console.log('✅ Cleanup completed\n');
    } else {
      console.log('✅ No existing submissions found\n');
    }

    // 3. Test N8N webhook
    console.log('📋 Step 3: Testing N8N webhook...');
    
    const webhookUrl = `https://n8n.drwapp.com/webhook/4a7f7831-77d7-44d5-8ced-c842bfd479db?memberId=${member.id}&taskId=${task.id}`;
    console.log(`   Webhook URL: ${webhookUrl}`);

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(webhookUrl, {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects automatically
    });

    console.log(`   Response Status: ${response.status} ${response.statusText}`);
    console.log(`   Response Headers:`, Object.fromEntries(response.headers.entries()));

    if (response.status === 302 || response.status === 301) {
      const redirectUrl = response.headers.get('location');
      console.log(`✅ Redirect successful to: ${redirectUrl}`);
      
      if (redirectUrl === task.link_postingan) {
        console.log('✅ Redirect URL matches task post link\n');
      } else {
        console.log('⚠️  Redirect URL does not match expected post link\n');
      }
    } else if (response.status === 200) {
      const responseText = await response.text();
      console.log(`   Response Body: ${responseText}\n`);
    } else {
      console.log(`❌ Unexpected response status\n`);
    }

    // 4. Check if submission was created in database
    console.log('📋 Step 4: Verifying database changes...');
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for N8N to process

    const newSubmission = await prisma.task_submissions.findFirst({
      where: {
        id_member: member.id,
        id_task: task.id
      },
      orderBy: { waktu_klik: 'desc' }
    });

    if (newSubmission) {
      console.log('✅ Task submission created successfully:');
      console.log(`   Status: ${newSubmission.status_submission}`);
      console.log(`   Created: ${newSubmission.waktu_klik}`);
      
      // Calculate deadline
      const deadline = new Date(newSubmission.waktu_klik);
      deadline.setHours(deadline.getHours() + 2);
      console.log(`   Deadline: ${deadline.toISOString()}\n`);
    } else {
      console.log('❌ Task submission was not created in database\n');
    }

    // 5. Test timeout scenario (optional)
    console.log('📋 Step 5: Testing timeout API...');
    
    if (newSubmission) {
      // Test timeout endpoint
      const timeoutResponse = await fetch('http://localhost:3001/api/task-submissions/timeout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${member.clerk_id}` // This might need adjustment based on your auth
        },
        body: JSON.stringify({ taskId: task.id })
      });

      console.log(`   Timeout API Status: ${timeoutResponse.status}`);
      
      if (timeoutResponse.ok) {
        const timeoutResult = await timeoutResponse.json();
        console.log('✅ Timeout API response:', timeoutResult);
      } else {
        const errorText = await timeoutResponse.text();
        console.log('⚠️  Timeout API error:', errorText);
      }
    }

    console.log('\n🎉 N8N Workflow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testN8NWorkflow();
