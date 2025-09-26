/**
 * Test Setting Name Update - Verify admin can change setting_name
 */

const fetch = require('node-fetch');

async function testSettingNameUpdate() {
  try {
    console.log('🧪 Testing Setting Name Update Functionality...\n');
    
    // Test 1: Get current event
    console.log('📊 Step 1: Get current holiday_mega_boost event...');
    const getResponse = await fetch('http://localhost:3000/api/events');
    
    if (!getResponse.ok) {
      console.log('⚠️  Server not running. Start with: npm run dev');
      return;
    }
    
    const getData = await getResponse.json();
    const holidayEvent = getData.events.find(e => e.setting_name === 'holiday_mega_boost');
    
    if (!holidayEvent) {
      console.log('❌ holiday_mega_boost event not found');
      return;
    }
    
    console.log('✅ Current event found:');
    console.log(`- setting_name: "${holidayEvent.setting_name}"`);
    console.log(`- setting_value: ${holidayEvent.setting_value}`);
    console.log(`- description: ${holidayEvent.description || 'N/A'}`);
    
    // Test 2: Try to update setting_name
    console.log('\\n🔄 Step 2: Testing setting_name update...');
    
    const updateData = {
      setting_name: 'mega_holiday_boost', // New name
      setting_value: '600',
      description: 'Mega Holiday Boost - Updated name test!',
      start_date: holidayEvent.start_date,
      end_date: holidayEvent.end_date
    };
    
    console.log(`Attempting to rename: ${holidayEvent.setting_name} → ${updateData.setting_name}`);
    
    const updateResponse = await fetch(`http://localhost:3000/api/events/${holidayEvent.setting_name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    const updateResult = await updateResponse.json();
    
    if (!updateResponse.ok) {
      console.log('❌ Update failed:');
      console.log('Response:', updateResult);
      return;
    }
    
    console.log('✅ Update successful!');
    console.log('Response:', JSON.stringify(updateResult, null, 2));
    
    // Test 3: Verify the change
    console.log('\\n🔍 Step 3: Verify the change...');
    
    const verifyResponse = await fetch('http://localhost:3000/api/events');
    const verifyData = await verifyResponse.json();
    
    const oldEvent = verifyData.events.find(e => e.setting_name === holidayEvent.setting_name);
    const newEvent = verifyData.events.find(e => e.setting_name === updateData.setting_name);
    
    console.log(`Old event (${holidayEvent.setting_name}): ${oldEvent ? 'EXISTS' : 'DELETED'}`);
    console.log(`New event (${updateData.setting_name}): ${newEvent ? 'EXISTS' : 'NOT FOUND'}`);
    
    if (!oldEvent && newEvent) {
      console.log('\\n🎉 SUCCESS! Setting name update working correctly!');
      console.log(`- Old name "${holidayEvent.setting_name}" deleted`);
      console.log(`- New name "${newEvent.setting_name}" created`);
      console.log(`- Data preserved: ${newEvent.setting_value}% boost`);
    } else {
      console.log('\\n❌ Something went wrong with the update');
    }
    
    // Test 4: Revert back for future tests
    console.log('\\n🔄 Step 4: Reverting back to original name...');
    
    if (newEvent) {
      const revertData = {
        setting_name: 'holiday_mega_boost', // Original name
        setting_value: '600',
        description: 'Holiday Mega Boost - 6x points untuk celebration!',
        start_date: newEvent.start_date,
        end_date: newEvent.end_date
      };
      
      const revertResponse = await fetch(`http://localhost:3000/api/events/${updateData.setting_name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(revertData)
      });
      
      if (revertResponse.ok) {
        console.log('✅ Reverted back to original name successfully');
      } else {
        console.log('⚠️  Revert failed, but test was successful');
      }
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testSettingNameUpdate();