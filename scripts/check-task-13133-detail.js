const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDetail() {
  try {
    const taskId = 13133;
    
    console.log('=== Analyzing Task 13133 Submissions vs Employees ===\n');
    
    // Get all submissions for this task
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
      }
    });
    
    console.log(`Total submissions for task ${taskId}: ${submissions.length}\n`);
    
    // Get all member IDs who submitted
    const submitterIds = submissions.map(s => s.id_member);
    
    console.log('Submitters:');
    submissions.forEach(s => {
      console.log(`  - ${s.members.nama_lengkap} (${s.members.email}) - Member ID: ${s.id_member}`);
      console.log(`    Status: ${s.status_submission}`);
    });
    
    // Check if these members are linked to drwcorp_employees
    console.log('\n--- Checking if submitters are DRWCorp employees ---\n');
    
    for (const sub of submissions) {
      const employee = await prisma.drwcorp_employees.findFirst({
        where: { member_id: sub.id_member }
      });
      
      if (employee) {
        console.log(`✅ ${sub.members.nama_lengkap} IS a DRWCorp employee`);
        console.log(`   Employee: ${employee.nama_lengkap} (${employee.email})`);
        console.log(`   Divisi: ${employee.divisi}`);
      } else {
        console.log(`❌ ${sub.members.nama_lengkap} is NOT linked to DRWCorp employees`);
        console.log(`   Member email: ${sub.members.email}`);
        
        // Try to find by email
        const possibleMatch = await prisma.drwcorp_employees.findFirst({
          where: {
            email: {
              equals: sub.members.email,
              mode: 'insensitive'
            }
          }
        });
        
        if (possibleMatch) {
          console.log(`   💡 Found possible match in employees: ${possibleMatch.nama_lengkap}`);
          console.log(`      But member_id is: ${possibleMatch.member_id || 'NULL'}`);
        }
      }
      console.log('');
    }
    
    // Count total employees
    const totalEmployees = await prisma.drwcorp_employees.count();
    const linkedEmployees = await prisma.drwcorp_employees.count({
      where: { member_id: { not: null } }
    });
    
    console.log('\n--- Employee Statistics ---');
    console.log(`Total employees: ${totalEmployees}`);
    console.log(`Linked employees: ${linkedEmployees}`);
    console.log(`Unlinked employees: ${totalEmployees - linkedEmployees}`);
    
    // Check how many employees have submitted task 13133
    const employeesWithSubmission = await prisma.drwcorp_employees.findMany({
      where: {
        member_id: {
          in: submitterIds
        }
      },
      select: {
        nama_lengkap: true,
        email: true,
        divisi: true,
        member_id: true
      }
    });
    
    console.log(`\nEmployees who submitted task ${taskId}: ${employeesWithSubmission.length}`);
    employeesWithSubmission.forEach(emp => {
      console.log(`  - ${emp.nama_lengkap} (${emp.email}) - Divisi: ${emp.divisi}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDetail();
