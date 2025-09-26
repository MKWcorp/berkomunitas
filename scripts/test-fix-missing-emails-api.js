// Simple test script for fix-missing-emails API
const fetch = require('node-fetch');

async function testFixMissingEmails() {
  try {
    console.log('🔍 Testing fix-missing-emails API...\n');
    
    // First, check for missing emails
    console.log('1. Checking for members without emails...');
    const checkResponse = await fetch('https://komunitas-komentar.vercel.app/api/admin/fix-missing-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'check' }),
    });
    
    const checkData = await checkResponse.json();
    console.log('✅ Check result:', checkData);
    
    if (checkData.success && checkData.members && checkData.members.length > 0) {
      console.log(`\n2. Found ${checkData.members.length} members without emails. Attempting to fix...`);
      
      // Now try to fix the missing emails
      const fixResponse = await fetch('https://komunitas-komentar.vercel.app/api/admin/fix-missing-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'fix' }),
      });
      
      const fixData = await fixResponse.json();
      console.log('🔧 Fix result:', JSON.stringify(fixData, null, 2));
      
      if (fixData.success && fixData.summary) {
        console.log('\n📊 Summary:');
        console.log(`   - Total processed: ${fixData.summary.total_processed}`);
        console.log(`   - Emails fixed: ${fixData.summary.emails_fixed}`);
        console.log(`   - Errors: ${fixData.summary.errors}`);
        console.log(`   - No email in Clerk: ${fixData.summary.no_email_in_clerk}`);
      }
    } else {
      console.log('✨ No members found without emails!');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testFixMissingEmails();
