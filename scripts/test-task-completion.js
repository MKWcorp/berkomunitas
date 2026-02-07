const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTaskCompletion() {
  try {
    const taskId = 13133;
    
    console.log('\n=== Testing Task Completion for Task ID:', taskId, '===\n');
    
    // 1. Check if task exists
    console.log('1. Checking if task exists...');
    const task = await prisma.tugas_ai.findUnique({
      where: { id: taskId }
    });
    
    if (!task) {
      console.log('❌ Task not found!');
      return;
    }
    
    console.log('✅ Task found:', {
      id: task.id,
      keyword: task.keyword_tugas,
      deskripsi: task.deskripsi_tugas?.substring(0, 50) + '...'
    });
    
    // 2. Check task_submissions for this task
    console.log('\n2. Checking task_submissions...');
    const submissions = await prisma.task_submissions.findMany({
      where: { id_task: taskId },
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true
          }
        }
      },
      take: 5
    });
    
    console.log(`Found ${submissions.length} submissions`);
    if (submissions.length > 0) {
      console.log('Sample submissions:');
      submissions.slice(0, 3).forEach(s => {
        console.log(`  - Member: ${s.members?.nama_lengkap || 'N/A'} (${s.members?.email || 'N/A'})`);
        console.log(`    Status: ${s.status_submission}`);
      });
    }
    
    // 3. Check drwcorp_employees
    console.log('\n3. Checking drwcorp_employees...');
    const employees = await prisma.drwcorp_employees.findMany({
      take: 5
    });
    
    console.log(`Total employees (sample): ${employees.length}`);
    employees.forEach(emp => {
      console.log(`  - ${emp.nama_lengkap} (${emp.email})`);
      console.log(`    Divisi: ${emp.divisi}`);
      console.log(`    Member ID: ${emp.member_id || 'NOT LINKED'}`);
      console.log(`    Status: ${emp.matching_status}`);
    });
    
    // 4. Check employees with member links
    console.log('\n4. Checking employees with member links...');
    const linkedEmployees = await prisma.drwcorp_employees.findMany({
      where: {
        member_id: { not: null }
      },
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
            task_submissions: {
              where: {
                id_task: taskId
              }
            }
          }
        }
      },
      take: 10
    });
    
    console.log(`\nFound ${linkedEmployees.length} employees with member links (sample)`);
    linkedEmployees.forEach(emp => {
      console.log(`\n  Employee: ${emp.nama_lengkap} (${emp.email})`);
      console.log(`  Member: ${emp.members?.nama_lengkap || 'N/A'} (ID: ${emp.member_id})`);
      console.log(`  Submissions for task ${taskId}: ${emp.members?.task_submissions?.length || 0}`);
      if (emp.members?.task_submissions?.length > 0) {
        emp.members.task_submissions.forEach(sub => {
          console.log(`    - Status: ${sub.status_submission}, Date: ${sub.tanggal_submission}`);
        });
      }
    });
    
    // 5. Test the actual query used in API
    console.log('\n5. Testing actual API query...');
    const apiResult = await prisma.drwcorp_employees.findMany({
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
            task_submissions: {
              where: {
                id_task: taskId
              },
              select: {
                id: true,
                status_submission: true,
                tanggal_submission: true,
                waktu_klik: true
              }
            }
          }
        }
      },
      orderBy: [
        { divisi: 'asc' },
        { nama_lengkap: 'asc' }
      ],
      take: 10
    });
    
    console.log(`\nAPI Query Result: ${apiResult.length} employees (sample)`);
    
    let completed = 0;
    let notCompleted = 0;
    
    apiResult.forEach(emp => {
      const hasSubmission = emp.members?.task_submissions?.length > 0;
      const submission = hasSubmission ? emp.members.task_submissions[0] : null;
      
      if (hasSubmission && submission.status_submission === 'selesai') {
        completed++;
        console.log(`  ✅ ${emp.nama_lengkap} - COMPLETED`);
      } else {
        notCompleted++;
        console.log(`  ❌ ${emp.nama_lengkap} - NOT COMPLETED (${emp.matching_status}, member: ${emp.member_id ? 'linked' : 'not linked'})`);
      }
    });
    
    console.log(`\n📊 Statistics (sample):`);
    console.log(`   Total: ${apiResult.length}`);
    console.log(`   Completed: ${completed}`);
    console.log(`   Not Completed: ${notCompleted}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTaskCompletion();
