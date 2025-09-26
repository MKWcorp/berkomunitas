/**
 * Debug Event Issues - Test setting_name update dan setting_value 600
 * 
 * Script untuk mendiagnosa:
 * 1. Mengapa nama event (setting_name) tidak berubah saat diupdate
 * 2. Mengapa setting_value 600 tidak muncul di halaman tugas
 */

const fetch = require('node-fetch');

async function debugEventIssues() {
  console.log('🔍 Debugging Event Issues\n');
  
  try {
    // Test 1: Check current events
    console.log('📡 Test 1: Checking current events from API...');
    
    try {
      const response = await fetch('http://localhost:3000/api/events/public');
      
      if (!response.ok) {
        console.log('⚠️  Server not running. Start with: npm run dev');
        console.log('   Manual testing required.');
        return;
      }
      
      const data = await response.json();
      console.log('Current events:', JSON.stringify(data, null, 2));
      
      const events = data.events || [];
      
      // Test 2: Analyze each event
      console.log('\n🔍 Test 2: Event Analysis');
      
      events.forEach((event, index) => {
        console.log(`\nEvent ${index + 1}:`);
        console.log(`- setting_name: "${event.setting_name}"`);
        console.log(`- setting_value: "${event.setting_value}" (type: ${typeof event.setting_value})`);
        console.log(`- start_date: ${event.start_date}`);
        console.log(`- end_date: ${event.end_date}`);
        
        // Test timing
        const now = new Date();
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        const isInTimePeriod = now >= startDate && now <= endDate;
        
        console.log(`- Current time: ${now.toISOString()}`);
        console.log(`- Is in time period: ${isInTimePeriod}`);
        
        if (!isInTimePeriod) {
          if (now < startDate) {
            console.log(`- Status: Event belum dimulai (starts in ${Math.round((startDate - now) / 1000 / 60)} minutes)`);
          } else {
            console.log(`- Status: Event sudah berakhir (ended ${Math.round((now - endDate) / 1000 / 60)} minutes ago)`);
          }
        } else {
          console.log(`- Status: Event sedang aktif`);
        }
        
        // Test numeric validation
        const settingValue = event.setting_value;
        const isNumericBoost = !isNaN(parseFloat(settingValue)) && parseFloat(settingValue) > 0;
        console.log(`- Is numeric boost: ${isNumericBoost}`);
        
        if (isNumericBoost) {
          const boostPercentage = parseFloat(settingValue);
          const pointValue = Math.round(boostPercentage / 10);
          console.log(`- Boost percentage: ${boostPercentage}%`);
          console.log(`- Point value: ${pointValue}`);
          console.log(`- Would be active: ${isInTimePeriod && isNumericBoost}`);
        }
      });
      
      // Test 3: Focus on 600 value events
      console.log('\n🎯 Test 3: Events with setting_value 600');
      
      const events600 = events.filter(e => e.setting_value == 600);
      
      if (events600.length === 0) {
        console.log('❌ No events found with setting_value 600');
        console.log('   Check if the event was saved correctly in admin panel');
      } else {
        events600.forEach((event, index) => {
          console.log(`\n600% Event ${index + 1}:`);
          console.log(`- Name: ${event.setting_name}`);
          
          const now = new Date();
          const startDate = new Date(event.start_date);
          const endDate = new Date(event.end_date);
          const isInTimePeriod = now >= startDate && now <= endDate;
          
          if (isInTimePeriod) {
            console.log('✅ Event is active and should show 600% boost!');
            console.log(`- Boost: 600%`);
            console.log(`- Points: ${Math.round(600 / 10)} per task`);
          } else {
            console.log('❌ Event timing is wrong');
            console.log(`- Need to update timing to current time`);
            console.log(`- Current: ${now.toISOString()}`);
            console.log(`- Event start: ${startDate.toISOString()}`);
            console.log(`- Event end: ${endDate.toISOString()}`);
          }
        });
      }
      
      // Test 4: setting_name update issue
      console.log('\n🏷️  Test 4: setting_name Update Issue');
      console.log('Problem: setting_name is PRIMARY KEY and used in URL path');
      console.log('Current API: PUT /api/events/[setting_name]');
      console.log('- setting_name in URL path cannot be changed');
      console.log('- Only setting_value, start_date, end_date can be updated');
      console.log('\nSolution Options:');
      console.log('1. Add separate event_name column');
      console.log('2. Change API to use ID instead of setting_name');
      console.log('3. Show setting_name as read-only in edit mode');
      
    } catch (apiError) {
      console.error('❌ API Error:', apiError.message);
    }
    
  } catch (error) {
    console.error('❌ Debug Error:', error.message);
  }
}

// Run debugging
debugEventIssues();