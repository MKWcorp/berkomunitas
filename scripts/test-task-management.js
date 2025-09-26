// Test script untuk Task Management API
// Jalankan dengan: node scripts/test-task-management.js

const BASE_URL = 'http://localhost:3000';

async function testTaskManagement() {
  console.log('🧪 Testing Task Management API...\n');
  
  try {
    // Test 1: Get all tasks
    console.log('📋 Test 1: GET all tasks');
    const tasksResponse = await fetch(`${BASE_URL}/api/admin/tugas`, {
      credentials: 'include'
    });
    
    const tasksResult = await tasksResponse.json();
    console.log(`Status: ${tasksResponse.status}`);
    console.log('Tasks count:', tasksResult.tasks?.length || 0);
    
    if (tasksResult.tasks && tasksResult.tasks.length > 0) {
      const firstTask = tasksResult.tasks[0];
      console.log('First task ID:', firstTask.id);
      console.log('---\n');

      // Test 2: Get task detail with submissions
      console.log(`📋 Test 2: GET task detail with submissions (ID: ${firstTask.id})`);
      const taskDetailResponse = await fetch(`${BASE_URL}/api/admin/tugas/${firstTask.id}`, {
        credentials: 'include'
      });
      
      const taskDetailResult = await taskDetailResponse.json();
      console.log(`Status: ${taskDetailResponse.status}`);
      console.log('Task:', taskDetailResult.task?.keyword_tugas || 'N/A');
      console.log('Submissions count:', taskDetailResult.task?.submissions?.length || 0);
      
      if (taskDetailResult.task?.submissions && taskDetailResult.task.submissions.length > 0) {
        const firstSubmission = taskDetailResult.task.submissions[0];
        console.log('First submission member:', firstSubmission.member?.nama_lengkap);
        console.log('Submission status:', firstSubmission.status_submission);
        console.log('---\n');

        // Test 3: Update submission
        console.log(`✏️ Test 3: UPDATE submission (ID: ${firstSubmission.id})`);
        const updateData = {
          status_submission: 'selesai',
          admin_notes: 'Test update from script',
          award_points: 5,
          keterangan: 'Test keterangan'
        };

        const updateResponse = await fetch(`${BASE_URL}/api/admin/task-submissions/${firstSubmission.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updateData)
        });
        
        const updateResult = await updateResponse.json();
        console.log(`Status: ${updateResponse.status}`);
        console.log('Update result:', JSON.stringify(updateResult, null, 2));
        console.log('---\n');

        // Test 4: Get updated submission
        console.log(`📋 Test 4: GET updated submission (ID: ${firstSubmission.id})`);
        const submissionResponse = await fetch(`${BASE_URL}/api/admin/task-submissions/${firstSubmission.id}`, {
          credentials: 'include'
        });
        
        const submissionResult = await submissionResponse.json();
        console.log(`Status: ${submissionResponse.status}`);
        console.log('Updated submission:', JSON.stringify(submissionResult, null, 2));
      } else {
        console.log('No submissions found for this task');
      }
    } else {
      console.log('No tasks found in the system');
    }

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test error cases
async function testErrorCases() {
  console.log('\n🚨 Testing Error Cases...\n');
  
  try {
    // Test invalid task ID
    console.log('Test: Invalid task ID (999999)');
    const invalidTaskResponse = await fetch(`${BASE_URL}/api/admin/tugas/999999`, {
      credentials: 'include'
    });
    
    const invalidTaskResult = await invalidTaskResponse.json();
    console.log(`Status: ${invalidTaskResponse.status}`);
    console.log('Response:', JSON.stringify(invalidTaskResult, null, 2));
    console.log('---\n');

    // Test invalid submission ID
    console.log('Test: Invalid submission ID (999999)');
    const invalidSubmissionResponse = await fetch(`${BASE_URL}/api/admin/task-submissions/999999`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ status_submission: 'selesai' })
    });
    
    const invalidSubmissionResult = await invalidSubmissionResponse.json();
    console.log(`Status: ${invalidSubmissionResponse.status}`);
    console.log('Response:', JSON.stringify(invalidSubmissionResult, null, 2));

  } catch (error) {
    console.error('Error during error testing:', error.message);
  }
}

// Jalankan tests
async function runAllTests() {
  await testTaskManagement();
  await testErrorCases();
  console.log('\n🏁 Testing completed!');
}

runAllTests();
