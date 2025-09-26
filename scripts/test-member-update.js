// Test script untuk API update member
// Jalankan dengan: node scripts/test-member-update.js

const BASE_URL = 'http://localhost:3000';

async function testMemberAPI() {
  console.log('🧪 Testing Member Update API...\n');
  
  // Test data
  const testMemberId = 63; // ID yang gagal di terminal
  const updateData = {
    nama_lengkap: 'Test Update Name',
    nomer_wa: '081234567890',
    loyalty_point: 150,
    bio: 'Updated bio for testing',
    status_kustom: 'Active Member'
  };

  try {
    // Test 1: GET member detail
    console.log('📋 Test 1: GET member detail');
    console.log(`GET ${BASE_URL}/api/admin/members/${testMemberId}`);
    
    const getResponse = await fetch(`${BASE_URL}/api/admin/members/${testMemberId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    const getMemberResult = await getResponse.json();
    console.log(`Status: ${getResponse.status}`);
    console.log('Response:', JSON.stringify(getMemberResult, null, 2));
    console.log('---\n');

    // Test 2: PUT update member
    console.log('✏️ Test 2: PUT update member');
    console.log(`PUT ${BASE_URL}/api/admin/members/${testMemberId}`);
    console.log('Data:', JSON.stringify(updateData, null, 2));
    
    const putResponse = await fetch(`${BASE_URL}/api/admin/members/${testMemberId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updateData)
    });
    
    const putResult = await putResponse.json();
    console.log(`Status: ${putResponse.status}`);
    console.log('Response:', JSON.stringify(putResult, null, 2));
    console.log('---\n');

    // Test 3: GET member setelah update untuk verifikasi
    if (putResponse.ok) {
      console.log('✅ Test 3: Verifikasi update');
      const verifyResponse = await fetch(`${BASE_URL}/api/admin/members/${testMemberId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      const verifyResult = await verifyResponse.json();
      console.log(`Status: ${verifyResponse.status}`);
      console.log('Updated data:', JSON.stringify(verifyResult, null, 2));
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
    // Test invalid ID
    console.log('Test: Invalid member ID (999999)');
    const invalidResponse = await fetch(`${BASE_URL}/api/admin/members/999999`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ nama_lengkap: 'Test' })
    });
    
    const invalidResult = await invalidResponse.json();
    console.log(`Status: ${invalidResponse.status}`);
    console.log('Response:', JSON.stringify(invalidResult, null, 2));
    console.log('---\n');

  } catch (error) {
    console.error('Error during error testing:', error.message);
  }
}

// Jalankan tests
async function runAllTests() {
  await testMemberAPI();
  await testErrorCases();
  console.log('🏁 Testing completed!');
}

runAllTests();
