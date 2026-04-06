/**
 * Test API Tugas endpoint
 */
const fetch = require('node-fetch');

async function testTugasAPI() {
  console.log('\n🧪 TESTING /api/tugas ENDPOINT');
  console.log('='.repeat(70));
  
  const url = 'http://localhost:3000/api/tugas?page=1&limit=10&filter=belum';
  
  console.log(`URL: ${url}`);
  console.log('');
  
  try {
    const response = await fetch(url, {
      headers: {
        'Cookie': 'access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZW1iZXJJZCI6MTEsImVtYWlsIjoid2lyb0Bkcndjb3JwLmNvbSIsImdvb2dsZUlkIjoiMTEzOTI1MDgwNjE0MzgxNTIwMzU3IiwicGxhdGZvcm0iOiJCZXJrb211bml0YXMiLCJpYXQiOjE3NzU1MTMxMjUsImV4cCI6MTc3NjExNzkyNX0.aKnJsHauzah_B3FmUKeUllrx4Ibnb8Xd7pvj5s0_IYk'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ SUCCESS!');
      console.log(`Total tasks: ${data.pagination?.totalTasks || 0}`);
      console.log(`Page: ${data.pagination?.page}`);
      console.log(`Limit: ${data.pagination?.limit}`);
      
      if (data.tasks && data.tasks.length > 0) {
        console.log(`\n📋 First task:`);
        console.log(JSON.stringify(data.tasks[0], null, 2));
      }
    } else {
      console.log('\n❌ ERROR!');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

testTugasAPI();
