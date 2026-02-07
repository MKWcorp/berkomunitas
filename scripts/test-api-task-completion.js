const fetch = require('node-fetch');

async function testAPI() {
  try {
    const taskId = 13133;
    const url = `http://localhost:3000/api/drwcorp/task-completion?taskId=${taskId}`;
    
    console.log('Testing API:', url);
    console.log('');
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    
    if (data.success) {
      console.log('\n=== Task Info ===');
      console.log('ID:', data.task.id);
      console.log('Keyword:', data.task.keyword_tugas);
      console.log('Description:', data.task.deskripsi_tugas?.substring(0, 50) + '...');
      
      console.log('\n=== Statistics ===');
      console.log('Total Employees:', data.statistics.total_employees);
      console.log('Completed:', data.statistics.completed_count);
      console.log('Not Completed:', data.statistics.not_completed_count);
      console.log('Completion Rate:', data.statistics.completion_rate + '%');
      console.log('Matched Employees:', data.statistics.matched_employees);
      console.log('Unmatched Employees:', data.statistics.unmatched_employees);
      
      console.log('\n=== Completed Employees (sample 5) ===');
      data.completed.slice(0, 5).forEach(emp => {
        console.log(`- ${emp.nama_lengkap} (${emp.email})`);
        console.log(`  Divisi: ${emp.divisi}`);
        console.log(`  Status: ${emp.submission?.status_submission}`);
      });
      
      console.log('\n=== Not Completed Employees (sample 10) ===');
      data.notCompleted.slice(0, 10).forEach(emp => {
        console.log(`- ${emp.nama_lengkap} (${emp.email})`);
        console.log(`  Divisi: ${emp.divisi}`);
        console.log(`  Matching Status: ${emp.matching_status}`);
      });
      
    } else {
      console.log('Error:', data.error);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
