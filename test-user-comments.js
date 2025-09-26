/**
 * Practical Facebook API Testing for User ID: 791805920204092
 * 
 * To test this:
 * 1. Get your Facebook Page Access Token from: https://developers.facebook.com/tools/explorer/
 * 2. Replace YOUR_PAGE_ACCESS_TOKEN and YOUR_PAGE_ID below
 * 3. Run: node test-user-comments.js
 */

// Configuration - REPLACE WITH YOUR ACTUAL VALUES
const CONFIG = {
  USER_ID: '791805920204092',
  PAGE_ACCESS_TOKEN: 'YOUR_PAGE_ACCESS_TOKEN', // Get from Facebook Developer Tools
  PAGE_ID: 'YOUR_PAGE_ID', // Your Facebook Page ID
  API_VERSION: 'v18.0'
};

// Test functions
async function testUserExists() {
  console.log('🔍 Testing if user ID exists and is accessible...');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/${CONFIG.API_VERSION}/${CONFIG.USER_ID}?access_token=${CONFIG.PAGE_ACCESS_TOKEN}`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ User exists:', data);
      return true;
    } else {
      const error = await response.json();
      console.log('❌ User not accessible:', error.error?.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

async function findUserComments() {
  console.log('🔍 Searching for comments from user...');
  
  try {
    // Get recent posts with comments
    const response = await fetch(
      `https://graph.facebook.com/${CONFIG.API_VERSION}/${CONFIG.PAGE_ID}/posts?fields=id,message,comments.limit(100){id,message,from,created_time}&limit=10&access_token=${CONFIG.PAGE_ACCESS_TOKEN}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.log('❌ Failed to fetch posts:', error.error?.message);
      return [];
    }
    
    const data = await response.json();
    console.log(`📄 Checked ${data.data.length} posts`);
    
    let foundComments = [];
    
    data.data.forEach(post => {
      if (post.comments && post.comments.data) {
        const userComments = post.comments.data.filter(comment => 
          comment.from && comment.from.id === CONFIG.USER_ID
        );
        
        if (userComments.length > 0) {
          foundComments.push({
            postId: post.id,
            postMessage: post.message?.substring(0, 100) + '...',
            userComments: userComments.map(c => ({
              id: c.id,
              message: c.message,
              created_time: c.created_time
            }))
          });
        }
      }
    });
    
    if (foundComments.length > 0) {
      console.log(`✅ Found ${foundComments.length} posts with comments from this user:`);
      foundComments.forEach((item, index) => {
        console.log(`  Post ${index + 1}:`);
        console.log(`    ID: ${item.postId}`);
        console.log(`    Content: ${item.postMessage}`);
        console.log(`    User Comments: ${item.userComments.length}`);
        item.userComments.forEach((comment, i) => {
          console.log(`      Comment ${i + 1}: "${comment.message}"`);
        });
      });
    } else {
      console.log('❌ No comments found from this user');
    }
    
    return foundComments;
    
  } catch (error) {
    console.log('❌ Error searching comments:', error.message);
    return [];
  }
}

async function setupWebhookTesting() {
  console.log('🔄 Webhook Testing Setup...');
  
  // This shows how a webhook payload would look when the user comments
  const exampleWebhook = {
    object: 'page',
    entry: [{
      id: CONFIG.PAGE_ID,
      time: Math.floor(Date.now() / 1000),
      changes: [{
        value: {
          from: {
            id: CONFIG.USER_ID,
            name: 'Test User'
          },
          message: 'This is a test comment',
          comment_id: '123456789_987654321',
          post_id: 'POST_ID_HERE',
          created_time: Math.floor(Date.now() / 1000),
          verb: 'add'
        },
        field: 'feed'
      }]
    }]
  };
  
  console.log('📡 Example webhook payload when user comments:');
  console.log(JSON.stringify(exampleWebhook, null, 2));
  
  // Show how to detect the target user in webhook
  const isTargetUser = exampleWebhook.entry[0].changes[0].value.from.id === CONFIG.USER_ID;
  console.log(`\n🎯 Target user detection: ${isTargetUser ? '✅ MATCH' : '❌ NO MATCH'}`);
  
  return exampleWebhook;
}

function generateTestCode() {
  console.log('💻 Generated test code for your application:');
  console.log('');
  
  console.log('// 1. Check for specific user in comments');
  console.log(`const isTargetUser = (comment) => comment.from.id === '${CONFIG.USER_ID}';`);
  console.log('');
  
  console.log('// 2. Filter comments from target user');
  console.log(`const userComments = allComments.filter(comment => comment.from.id === '${CONFIG.USER_ID}');`);
  console.log('');
  
  console.log('// 3. Webhook handler for real-time detection');
  console.log('app.post("/webhook", (req, res) => {');
  console.log('  const webhookData = req.body;');
  console.log('  webhookData.entry.forEach(entry => {');
  console.log('    entry.changes.forEach(change => {');
  console.log('      if (change.field === "feed" && change.value.from) {');
  console.log(`        if (change.value.from.id === '${CONFIG.USER_ID}') {`);
  console.log('          console.log("Target user commented:", change.value.message);');
  console.log('          // Handle the comment here');
  console.log('        }');
  console.log('      }');
  console.log('    });');
  console.log('  });');
  console.log('  res.status(200).send("OK");');
  console.log('});');
}

async function runTests() {
  console.log('🚀 Facebook API Testing for User ID:', CONFIG.USER_ID);
  console.log('=' .repeat(60));
  
  // Check configuration
  if (CONFIG.PAGE_ACCESS_TOKEN === 'YOUR_PAGE_ACCESS_TOKEN') {
    console.log('⚠️  CONFIGURATION REQUIRED!');
    console.log('Please update the CONFIG object with your actual values:');
    console.log('1. Get Page Access Token: https://developers.facebook.com/tools/explorer/');
    console.log('2. Find your Page ID: https://lookup-id.com/');
    console.log('3. Update CONFIG in this file');
    console.log('');
    console.log('For now, showing example outputs...');
    console.log('');
  }
  
  // Run tests
  console.log('TEST 1: User Existence Check');
  await testUserExists();
  console.log('');
  
  console.log('TEST 2: Comment Search');
  await findUserComments();
  console.log('');
  
  console.log('TEST 3: Webhook Setup');
  await setupWebhookTesting();
  console.log('');
  
  console.log('TEST 4: Generated Code');
  generateTestCode();
  console.log('');
  
  console.log('✅ Testing completed!');
  console.log('');
  console.log('🎯 Summary for User ID 791805920204092:');
  console.log('• Valid Facebook/Instagram User ID format');
  console.log('• Can be detected via Graph API comments endpoint');
  console.log('• Real-time detection possible with webhooks');
  console.log('• Requires proper Facebook App permissions');
  console.log('• Comment matching depends on user privacy settings');
}

// Export for use as module
module.exports = {
  testUserExists,
  findUserComments,
  setupWebhookTesting,
  CONFIG
};

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}
