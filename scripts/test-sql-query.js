/**
 * Test SQL Query for N8N Workflow
 * This directly tests the SQL query that N8N should execute
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSQLQuery() {
  console.log('🧪 Testing SQL Query for N8N...\n');

  try {
    // Get test data
    const member = await prisma.members.findFirst({
      where: { google_id: { not: null } },
      select: { id: true, nama_lengkap: true }
    });

    const task = await prisma.tugas_ai.findFirst({
      where: { status: 'tersedia' },
      select: { id: true, keyword_tugas: true, link_postingan: true }
    });

    console.log(`Using Member ID: ${member.id}, Task ID: ${task.id}`);

    // Test the exact SQL query that N8N will use
    const sqlQuery = `
      INSERT INTO task_submissions (id_member, id_task, status_submission, waktu_klik)
      VALUES ($1, $2, 'sedang_verifikasi', NOW())
      ON CONFLICT ON CONSTRAINT unique_member_task 
      DO UPDATE SET 
          status_submission = 'sedang_verifikasi',
          waktu_klik = NOW()
      WHERE task_submissions.status_submission IN ('tersedia', 'gagal_diverifikasi')
      RETURNING *;
    `;

    console.log('🔧 Executing SQL query...');
    const result = await prisma.$queryRawUnsafe(sqlQuery, member.id, task.id);
    
    console.log('✅ SQL Query successful!');
    console.log('📄 Result:', result);

    // Verify the submission exists
    const submission = await prisma.task_submissions.findFirst({
      where: { id_member: member.id, id_task: task.id }
    });

    console.log('📋 Final submission in database:');
    console.log({
      id: submission.id,
      status: submission.status_submission,
      created: submission.waktu_klik
    });

  } catch (error) {
    console.error('❌ SQL Test failed:', error.message);
    
    // Let's try a simpler version
    console.log('\n🔧 Trying simpler INSERT...');
    try {
      const result = await prisma.task_submissions.create({
        data: {
          id_member: member.id,
          id_task: task.id,
          status_submission: 'sedang_verifikasi',
          waktu_klik: new Date()
        }
      });
      console.log('✅ Simple INSERT worked:', result);
    } catch (innerError) {
      console.error('❌ Simple INSERT also failed:', innerError.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testSQLQuery();
