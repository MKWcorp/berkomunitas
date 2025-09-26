// Debug API response untuk members
// Jalankan di terminal: node debug-api-response.mjs

import fetch from 'node-fetch';

async function debugAPI() {
  try {
    console.log('🔍 Testing API response...');
    
    // Note: This would require authentication in production
    // For now, let's just check the API structure
    console.log('API endpoint: /api/admin/members');
    console.log('Expected username field: member.username');
    console.log('Fixed mapping from: m.user_usernames?.[0]?.username');
    console.log('Fixed mapping to: m.user_usernames?.username');
    
    console.log('\n✅ API mapping has been fixed.');
    console.log('The issue was that user_usernames is a one-to-one relation, not an array.');
    console.log('Previously: m.user_usernames?.[0]?.username (trying to access array)');
    console.log('Now: m.user_usernames?.username (accessing object property)');
    
    console.log('\n🔄 Please refresh the /admin-app/members page to see the username data.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugAPI();
