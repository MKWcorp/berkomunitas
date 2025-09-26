/**
 * Test 600% Boost - Verify event is now active and showing correctly
 */

const fetch = require('node-fetch');

async function test600Boost() {
  try {
    console.log('🎯 Testing 600% Boost Display...\n');
    
    // Test API endpoint
    console.log('📡 Testing /api/events/public...');
    const response = await fetch('http://localhost:3000/api/events/public');
    
    if (!response.ok) {
      console.log('⚠️  Server not running. Start with: npm run dev');
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response:', JSON.stringify(data, null, 2));
    
    const events = data.events || [];
    const event600 = events.find(e => e.setting_value == 600);
    
    if (!event600) {
      console.log('❌ Event 600% not found in API response');
      return;
    }
    
    console.log('\n🎉 Found 600% Event:');
    console.log(`- Name: ${event600.setting_name}`);
    console.log(`- Value: ${event600.setting_value}%`);
    console.log(`- Description: ${event600.description || 'N/A'}`);
    console.log(`- Start: ${event600.start_date}`);
    console.log(`- End: ${event600.end_date}`);
    
    // Test timing
    const now = new Date();
    const startDate = new Date(event600.start_date);
    const endDate = new Date(event600.end_date);
    const isActive = now >= startDate && now <= endDate;
    
    console.log('\n⏰ Timing Check:');
    console.log(`- Current: ${now.toISOString()}`);
    console.log(`- Active: ${isActive}`);
    
    if (isActive) {
      console.log('\n🔥 SUCCESS! Event should now show:');
      console.log(`- 600% Boost on /tugas page`);
      console.log(`- ${Math.round(600 / 10)} points per task`);
      console.log(`- Title: "${event600.setting_name.toUpperCase()} BOOST"`);
    } else {
      console.log('\n❌ Event timing still wrong');
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

test600Boost();