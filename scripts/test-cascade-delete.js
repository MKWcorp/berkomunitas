#!/usr/bin/env node

/**
 * Test Cascade Delete Functionality
 * 
 * This script tests the cascade delete behavior for task submissions
 * when a task is deleted from tugas_ai table.
 */

const prisma = require('../lib/prisma').default;

// Color codes
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

async function testCascadeDelete() {
  console.log(`\n${MAGENTA}${'='.repeat(60)}${RESET}`);
  console.log(`${MAGENTA}TEST: CASCADE DELETE FUNCTIONALITY${RESET}`);
  console.log(`${MAGENTA}${'='.repeat(60)}${RESET}\n`);

  try {
    // Step 1: Find a test task with submissions
    console.log(`${CYAN}[STEP 1]${RESET} Finding test data...`);
    
    const testTask = await prisma.tugas_ai.findFirst({
      where: {
        task_submissions: {
          some: {}
        }
      },
      include: {
        task_submissions: true
      }
    });

    if (!testTask) {
      console.log(`${YELLOW}[INFO]${RESET} No tasks with submissions found for testing`);
      console.log(`${YELLOW}[INFO]${RESET} Creating test data...\n`);
      
      // Create test task
      const newTask = await prisma.tugas_ai.create({
        data: {
          title: 'TEST CASCADE DELETE - Safe to Delete',
          objective: 'This is a test task for cascade delete functionality',
          points: 10,
          admin_id: '1'
        }
      });
      
      console.log(`${GREEN}[CREATED]${RESET} Test task ID: ${newTask.id}`);
      
      // Create test submission
      const testMember = await prisma.members.findFirst();
      
      if (testMember) {
        const newSubmission = await prisma.task_submissions.create({
          data: {
            id_task: newTask.id,
            id_member: testMember.id,
            status_submission: 'tersedia'
          }
        });
        
        console.log(`${GREEN}[CREATED]${RESET} Test submission ID: ${newSubmission.id}\n`);
        
        // Reload task with submissions
        return await prisma.tugas_ai.findUnique({
          where: { id: newTask.id },
          include: {
            task_submissions: true
          }
        });
      }
      
      return newTask;
    }

    console.log(`${GREEN}[FOUND]${RESET} Test task:`);
    console.log(`  → Task ID: ${testTask.id}`);
    console.log(`  → Title: ${testTask.title}`);
    console.log(`  → Submissions count: ${testTask.task_submissions.length}\n`);

    return testTask;

  } catch (error) {
    console.error(`${RED}[ERROR]${RESET} Failed to find/create test data:`, error);
    throw error;
  }
}

async function verifyBeforeDelete(taskId) {
  console.log(`${CYAN}[STEP 2]${RESET} Verifying data before delete...`);
  
  const submissionsCount = await prisma.task_submissions.count({
    where: { id_task: taskId }
  });
  
  console.log(`  → Submissions before delete: ${YELLOW}${submissionsCount}${RESET}\n`);
  
  return submissionsCount;
}

async function performDelete(taskId) {
  console.log(`${CYAN}[STEP 3]${RESET} Deleting task (should cascade to submissions)...`);
  
  try {
    await prisma.tugas_ai.delete({
      where: { id: taskId }
    });
    
    console.log(`${GREEN}[SUCCESS]${RESET} Task deleted successfully\n`);
    return true;
  } catch (error) {
    console.error(`${RED}[ERROR]${RESET} Failed to delete task:`, error);
    return false;
  }
}

async function verifyAfterDelete(taskId) {
  console.log(`${CYAN}[STEP 4]${RESET} Verifying cascade delete...`);
  
  const submissionsCount = await prisma.task_submissions.count({
    where: { id_task: taskId }
  });
  
  const taskExists = await prisma.tugas_ai.findUnique({
    where: { id: taskId }
  });
  
  console.log(`  → Task exists: ${taskExists ? RED + 'YES (FAIL)' : GREEN + 'NO (SUCCESS)'}${RESET}`);
  console.log(`  → Submissions remaining: ${submissionsCount === 0 ? GREEN + '0 (SUCCESS)' : RED + submissionsCount + ' (FAIL)'}${RESET}\n`);
  
  return submissionsCount === 0 && !taskExists;
}

async function main() {
  try {
    // Run test
    const testTask = await testCascadeDelete();
    
    if (!testTask) {
      console.log(`${RED}[FAIL]${RESET} Could not prepare test data`);
      process.exit(1);
    }

    const beforeCount = await verifyBeforeDelete(testTask.id);
    
    if (beforeCount === 0) {
      console.log(`${YELLOW}[WARNING]${RESET} No submissions to test cascade delete`);
      console.log(`${YELLOW}[INFO]${RESET} Deleting task anyway for cleanup...\n`);
    }

    const deleteSuccess = await performDelete(testTask.id);
    
    if (!deleteSuccess) {
      console.log(`${RED}[FAIL]${RESET} Could not delete task`);
      process.exit(1);
    }

    const verifySuccess = await verifyAfterDelete(testTask.id);

    // Summary
    console.log(`${BLUE}${'='.repeat(60)}${RESET}`);
    console.log(`${BLUE}TEST SUMMARY${RESET}`);
    console.log(`${BLUE}${'='.repeat(60)}${RESET}\n`);

    if (verifySuccess) {
      console.log(`${GREEN}[SUCCESS]${RESET} CASCADE DELETE IS WORKING! ✓`);
      console.log(`${GREEN}[SUCCESS]${RESET} All submissions were automatically deleted`);
      console.log(`${GREEN}[SUCCESS]${RESET} Admin panel "Kelola Tugas" should work correctly\n`);
    } else {
      console.log(`${RED}[FAIL]${RESET} CASCADE DELETE NOT WORKING! ✗`);
      console.log(`${RED}[FAIL]${RESET} Orphaned submissions detected`);
      console.log(`${YELLOW}[INFO]${RESET} You may need to re-run the migration script\n`);
    }

  } catch (error) {
    console.error(`\n${RED}[ERROR]${RESET} Test failed:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
main();
