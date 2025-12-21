#!/usr/bin/env node
/**
 * Test script untuk debug API /api/admin/tugas
 */

async function testAdminTugasAPI() {
  console.log('=' .repeat(80));
  console.log('TEST: /api/admin/tugas API Endpoint');
  console.log('=' .repeat(80));
  console.log();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const endpoint = `${baseUrl}/api/admin/tugas?page=1&q=`;

  console.log(`📍 Testing endpoint: ${endpoint}`);
  console.log();

  try {
    console.log('🔄 Making request...');
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log();

    const data = await response.json();
    
    console.log('📦 Response Data:');
    console.log(JSON.stringify(data, null, 2));
    console.log();

    if (response.ok) {
      console.log('✅ SUCCESS!');
      console.log(`   Total tasks: ${data.tasks?.length || 0}`);
      console.log(`   Total count: ${data.total || 0}`);
      console.log(`   Has more: ${data.hasMore || false}`);
      
      if (data.tasks?.length > 0) {
        console.log();
        console.log('📝 First Task Sample:');
        console.log(`   ID: ${data.tasks[0].id}`);
        console.log(`   Keyword: ${data.tasks[0].keyword_tugas}`);
        console.log(`   Status: ${data.tasks[0].status}`);
      }
    } else {
      console.log('❌ FAILED!');
      console.log(`   Error: ${data.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.log('❌ ERROR!');
    console.error(error);
  }

  console.log();
  console.log('=' .repeat(80));
}

testAdminTugasAPI();
