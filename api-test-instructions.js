// Test API endpoint for privilege data
console.log('🔧 Testing /api/rewards/redeem endpoint for privilege data...');

console.log('\\nTo test the API fix:');
console.log('1. Open your browser to http://localhost:3000/rewards');
console.log('2. Open Developer Tools (F12) > Network tab');
console.log('3. Refresh the page');
console.log('4. Look for the "/api/rewards/redeem" request');
console.log('5. Check the response data for member.privilege field');
console.log('\\nExpected result:');
console.log('- member.privilege should be "admin" (not undefined)');
console.log('- All berkomunitasplus rewards should now be accessible');
console.log('\\nIf privilege is still undefined, check:');
console.log('- user_privileges table has active record for the admin user');
console.log('- clerk_id matches between members and user_privileges tables');
console.log('\\n🎯 After this fix, admin should be able to access berkomunitasplus rewards!');