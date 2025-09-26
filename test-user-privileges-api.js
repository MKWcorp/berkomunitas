// Test script for user-privileges API
// Run this in browser console while logged in as drwcorpora@gmail.com

async function testUserPrivileges() {
  try {
    console.log('🧪 Testing /api/user-privileges endpoint...');
    
    const response = await fetch('/api/user-privileges');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (data.success) {
      console.log('✅ API call successful');
      console.log('Privileges found:', data.privileges);
      
      const hasAdmin = data.privileges.includes('admin');
      const hasPartner = data.privileges.includes('partner');
      
      console.log('Has admin privilege:', hasAdmin);
      console.log('Has partner privilege:', hasPartner);
      console.log('Should have rewards access:', hasAdmin || hasPartner);
    } else {
      console.log('❌ API call failed:', data.error);
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Auto run
testUserPrivileges();