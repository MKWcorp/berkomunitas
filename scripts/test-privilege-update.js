// Test script untuk API update privilege
// Jalankan dengan: node scripts/test-privilege-update.js

const BASE_URL = 'http://localhost:3000';

async function testPrivilegeAPI() {
  console.log('🧪 Testing Privilege Update API...\n');
  
  // Test data
  const testPrivilegeId = 17; // ID yang gagal di terminal
  const updateData = {
    privilege: 'test_privilege',
    is_active: true,
    granted_by: 'admin_test'
  };

  try {
    // Test 1: GET all privileges first to see structure
    console.log('📋 Test 1: GET all privileges');
    console.log(`GET ${BASE_URL}/api/admin/privileges`);
    
    const getAllResponse = await fetch(`${BASE_URL}/api/admin/privileges`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    const getAllResult = await getAllResponse.json();
    console.log(`Status: ${getAllResponse.status}`);
    console.log('Privileges:', JSON.stringify(getAllResult, null, 2));
    console.log('---\n');

    // Test 2: PUT update privilege
    console.log('✏️ Test 2: PUT update privilege');
    console.log(`PUT ${BASE_URL}/api/admin/privileges/${testPrivilegeId}`);
    console.log('Data:', JSON.stringify(updateData, null, 2));
    
    const putResponse = await fetch(`${BASE_URL}/api/admin/privileges/${testPrivilegeId}`, {
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

    // Test 3: Test with minimal data
    if (!putResponse.ok) {
      console.log('✅ Test 3: Retry with minimal data');
      const minimalData = {
        privilege: 'minimal_test',
        is_active: false
      };
      
      const retryResponse = await fetch(`${BASE_URL}/api/admin/privileges/${testPrivilegeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(minimalData)
      });
      
      const retryResult = await retryResponse.json();
      console.log(`Status: ${retryResponse.status}`);
      console.log('Response:', JSON.stringify(retryResult, null, 2));
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
    console.log('Test: Invalid privilege ID (999999)');
    const invalidResponse = await fetch(`${BASE_URL}/api/admin/privileges/999999`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ privilege: 'test', is_active: true })
    });
    
    const invalidResult = await invalidResponse.json();
    console.log(`Status: ${invalidResponse.status}`);
    console.log('Response:', JSON.stringify(invalidResult, null, 2));
    console.log('---\n');

    // Test missing privilege field
    console.log('Test: Missing privilege field');
    const missingResponse = await fetch(`${BASE_URL}/api/admin/privileges/17`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ is_active: true }) // Missing privilege
    });
    
    const missingResult = await missingResponse.json();
    console.log(`Status: ${missingResponse.status}`);
    console.log('Response:', JSON.stringify(missingResult, null, 2));

  } catch (error) {
    console.error('Error during error testing:', error.message);
  }
}

// Test database connection
async function testDatabaseConnection() {
  console.log('\n🔌 Testing Database Connection...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/debug-db`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('DB Status:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Database connection test failed:', error.message);
  }
}

// Jalankan tests
async function runAllTests() {
  await testDatabaseConnection();
  await testPrivilegeAPI();
  await testErrorCases();
  console.log('🏁 Testing completed!');
}

runAllTests();
