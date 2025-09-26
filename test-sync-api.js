// Test script untuk sync DRW API data
import fetch from 'node-fetch';

async function testSyncAPI() {
  try {
    console.log('🔄 Testing DRW API sync endpoint...');
    console.log('URL: http://localhost:3000/api/beauty-consultant/sync');
    
    // Note: Endpoint ini memerlukan admin auth, jadi akan gagal tanpa proper auth
    // Tapi kita bisa test GET endpoint dulu untuk cek status
    
    console.log('\n📊 Testing GET endpoint (check current status)...');
    const getResponse = await fetch('http://localhost:3000/api/beauty-consultant/sync');
    const getResult = await getResponse.json();
    
    console.log('GET Response Status:', getResponse.status);
    console.log('GET Response:', JSON.stringify(getResult, null, 2));
    
    if (getResponse.status === 401) {
      console.log('\n⚠️  Expected 401 - endpoint requires authentication');
      console.log('This is normal behavior for admin-only endpoints');
    }
    
    // Direct test ke DRW API
    console.log('\n🌐 Testing direct DRW API call...');
    const drwResponse = await fetch('https://drwgroup.id/apis/reseller/get', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer c5d46484b83e6d90d2c55bc7a0ec9782493a1fa2434b66ebed36c3e668f74e89',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    console.log('DRW API Response Status:', drwResponse.status);
    
    if (drwResponse.ok) {
      const drwData = await drwResponse.json();
      console.log('DRW API Success!');
      console.log('Response structure:', {
        success: drwData.success,
        dataCount: Array.isArray(drwData.data) ? drwData.data.length : 'not array',
        sampleData: Array.isArray(drwData.data) && drwData.data.length > 0 ? drwData.data[0] : 'no sample'
      });
      
      if (Array.isArray(drwData.data) && drwData.data.length > 0) {
        console.log('\n📋 First reseller data structure:');
        const firstReseller = drwData.data[0];
        console.log('Available fields:', Object.keys(firstReseller));
        console.log('Sample data:', JSON.stringify(firstReseller, null, 2));
      }
    } else {
      console.log('DRW API Error:', drwResponse.statusText);
      const errorText = await drwResponse.text();
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testSyncAPI();