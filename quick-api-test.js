// Quick debug to check if API now returns privilege
console.log('🔍 Quick test for API privilege fix...');

// Add temporary debug to rewards page
console.log('\\nTemporary debug code to check API response:');
console.log('Add this to your browser console when on /rewards page:');
console.log('\\n' + '='.repeat(60));
console.log(`
fetch('/api/rewards/redeem')
  .then(response => response.json())
  .then(data => {
    console.log('🔍 API Response:', data);
    console.log('🔍 Member Privilege:', data?.data?.member?.privilege);
    console.log('🔍 Member Data Keys:', Object.keys(data?.data?.member || {}));
    
    if (data?.data?.member?.privilege) {
      console.log('✅ SUCCESS: Privilege data is now available!');
      console.log('✅ User Privilege:', data.data.member.privilege);
    } else {
      console.log('❌ FAIL: Privilege data still missing');
    }
  })
  .catch(error => console.error('API Error:', error));
`);
console.log('='.repeat(60));
console.log('\\n🎯 Expected Result:');
console.log('- Member Privilege should show "admin"');
console.log('- If successful, refresh the page to see berkomunitasplus rewards become accessible!');