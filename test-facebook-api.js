/**
 * Facebook API Testing Script
 * Testing platform_user_id: 791805920204092
 * 
 * This script tests various Facebook Graph API endpoints to check
 * if we can detect comments from the given user ID
 */

const PLATFORM_USER_ID = '791805920204092';

// You'll need to get these tokens from Facebook Developer Console
const ACCESS_TOKEN = 'YOUR_PAGE_ACCESS_TOKEN'; // Replace with actual token
const PAGE_ID = 'YOUR_PAGE_ID'; // Replace with your page ID

/**
 * Test 1: Check if user ID is valid and accessible
 */
async function testUserIdValidity() {
  console.log('🔍 Testing User ID Validity...');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PLATFORM_USER_ID}?access_token=${ACCESS_TOKEN}`
    );
    
    if (response.ok) {
      const userData = await response.json();
      console.log('✅ User ID is valid:', userData);
      return userData;
    } else {
      const error = await response.json();
      console.log('❌ User ID validation failed:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing user ID:', error);
    return null;
  }
}

/**
 * Test 2: Get page posts and check for comments from this user
 */
async function testCommentsDetection() {
  console.log('🔍 Testing Comments Detection...');
  
  try {
    // Get recent posts from page
    const postsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${PAGE_ID}/posts?fields=id,message,comments{id,message,from}&limit=10&access_token=${ACCESS_TOKEN}`
    );
    
    if (!postsResponse.ok) {
      throw new Error('Failed to fetch posts');
    }
    
    const postsData = await postsResponse.json();
    console.log(`📄 Found ${postsData.data.length} posts`);
    
    let foundComments = [];
    
    // Check each post for comments from our target user
    postsData.data.forEach(post => {
      if (post.comments && post.comments.data) {
        const userComments = post.comments.data.filter(comment => 
          comment.from && comment.from.id === PLATFORM_USER_ID
        );
        
        if (userComments.length > 0) {
          foundComments.push({
            postId: post.id,
            postMessage: post.message?.substring(0, 100) + '...',
            comments: userComments
          });
        }
      }
    });
    
    if (foundComments.length > 0) {
      console.log('✅ Found comments from user:', foundComments);
      return foundComments;
    } else {
      console.log('❌ No comments found from this user ID');
      return [];
    }
    
  } catch (error) {
    console.error('❌ Error testing comments detection:', error);
    return [];
  }
}

/**
 * Test 3: Search for specific comment content
 */
async function testCommentMatching(searchText) {
  console.log(`🔍 Testing Comment Matching for: "${searchText}"`);
  
  try {
    // This would require getting all comments and filtering
    // Facebook doesn't provide direct comment search by content
    
    const postsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${PAGE_ID}/posts?fields=id,comments{id,message,from,created_time}&limit=50&access_token=${ACCESS_TOKEN}`
    );
    
    const postsData = await postsResponse.json();
    let matchingComments = [];
    
    postsData.data.forEach(post => {
      if (post.comments && post.comments.data) {
        const matches = post.comments.data.filter(comment => {
          const isFromTargetUser = comment.from && comment.from.id === PLATFORM_USER_ID;
          const containsSearchText = comment.message && comment.message.toLowerCase().includes(searchText.toLowerCase());
          return isFromTargetUser && containsSearchText;
        });
        
        matchingComments.push(...matches);
      }
    });
    
    console.log(`📝 Found ${matchingComments.length} matching comments`);
    return matchingComments;
    
  } catch (error) {
    console.error('❌ Error in comment matching:', error);
    return [];
  }
}

/**
 * Test 4: Webhook simulation - how comments would be detected in real-time
 */
function simulateWebhookData() {
  console.log('🔄 Simulating Webhook Data...');
  
  // This is how Facebook sends webhook data when a comment is posted
  const webhookExample = {
    entry: [{
      id: PAGE_ID,
      time: Date.now(),
      changes: [{
        value: {
          from: {
            id: PLATFORM_USER_ID,
            name: "Test User"
          },
          message: "Test comment message",
          comment_id: "123456789_987654321",
          post_id: "123456789",
          created_time: Math.floor(Date.now() / 1000),
          parent_id: null
        },
        field: "feed"
      }]
    }]
  };
  
  console.log('📡 Webhook payload example:', JSON.stringify(webhookExample, null, 2));
  
  // Check if the user ID matches
  const isTargetUser = webhookExample.entry[0].changes[0].value.from.id === PLATFORM_USER_ID;
  console.log(`🎯 Is target user: ${isTargetUser}`);
  
  return webhookExample;
}

/**
 * Main testing function
 */
async function runAllTests() {
  console.log('🚀 Starting Facebook API Tests for User ID:', PLATFORM_USER_ID);
  console.log('=' .repeat(60));
  
  // Check if we have access tokens
  if (ACCESS_TOKEN === 'YOUR_PAGE_ACCESS_TOKEN') {
    console.log('⚠️  Please set your Facebook access tokens first!');
    console.log('📝 Get tokens from: https://developers.facebook.com/tools/explorer/');
    console.log('');
  }
  
  // Test 1: User ID validity
  await testUserIdValidity();
  console.log('');
  
  // Test 2: Comments detection
  await testCommentsDetection();
  console.log('');
  
  // Test 3: Comment matching
  await testCommentMatching('test keyword');
  console.log('');
  
  // Test 4: Webhook simulation
  simulateWebhookData();
  console.log('');
  
  console.log('✅ All tests completed!');
}

/**
 * Export for use in other scripts
 */
module.exports = {
  testUserIdValidity,
  testCommentsDetection,
  testCommentMatching,
  simulateWebhookData,
  PLATFORM_USER_ID
};

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
