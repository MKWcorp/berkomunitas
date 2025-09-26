/**
 * Facebook Get Comments From Media - Configuration Analysis
 * Based on screenshot: Node ID 5897582508966858_1221315003625769946
 */

const MEDIA_ID = "5897582508966858_1221315003625769946";
const API_VERSION = "v22.0";

console.log('🔍 Facebook "Get Comment From Media" Configuration Analysis');
console.log('=' .repeat(60));
console.log(`📋 Media ID: ${MEDIA_ID}`);
console.log(`📋 API Version: ${API_VERSION}`);
console.log('');

/**
 * 1. CURRENT CONFIGURATION ANALYSIS
 */
function analyzeCurrentConfig() {
  console.log('📊 Current Configuration Analysis:');
  console.log('');
  
  console.log('✅ CORRECT Settings:');
  console.log('   • HTTP Method: GET');
  console.log('   • Graph API Version: v22.0 (latest)');
  console.log('   • Node: 5897582508966858_1221315003625769946 (valid media/post ID)');
  console.log('   • Edge: comments');
  console.log('   • Query Parameter: order=reverse_chronological');
  console.log('');
  
  console.log('⚠️  MISSING/NEEDS IMPROVEMENT:');
  console.log('   • Fields parameter (to get comment details)');
  console.log('   • Access token configuration');
  console.log('   • Limit parameter (for pagination control)');
  console.log('   • Filter parameter (optional, for specific user)');
  console.log('');
}

/**
 * 2. RECOMMENDED CONFIGURATION
 */
function generateRecommendedConfig() {
  console.log('🛠️ Recommended Configuration:');
  console.log('');
  
  console.log('Base URL:');
  console.log(`https://graph.facebook.com/${API_VERSION}/${MEDIA_ID}/comments`);
  console.log('');
  
  console.log('Required Query Parameters:');
  console.log('┌─────────────────┬─────────────────────────────────────────────┐');
  console.log('│ Parameter       │ Value                                       │');
  console.log('├─────────────────┼─────────────────────────────────────────────┤');
  console.log('│ access_token    │ YOUR_PAGE_ACCESS_TOKEN                      │');
  console.log('│ fields          │ id,message,from,created_time,like_count     │');
  console.log('│ order           │ reverse_chronological                       │');
  console.log('│ limit           │ 100                                         │');
  console.log('└─────────────────┴─────────────────────────────────────────────┘');
  console.log('');
  
  console.log('Optional Parameters for User Detection:');
  console.log('┌─────────────────┬─────────────────────────────────────────────┐');
  console.log('│ Parameter       │ Purpose                                     │');
  console.log('├─────────────────┼─────────────────────────────────────────────┤');
  console.log('│ filter          │ stream (for public comments only)          │');
  console.log('│ since           │ 2024-01-01 (comments after date)           │');
  console.log('│ until           │ 2024-12-31 (comments before date)          │');
  console.log('└─────────────────┴─────────────────────────────────────────────┘');
  console.log('');
}

/**
 * 3. COMPLETE API CALL EXAMPLES
 */
function generateAPIExamples() {
  console.log('📞 Complete API Call Examples:');
  console.log('');
  
  console.log('1. Basic Comment Retrieval:');
  console.log(`GET https://graph.facebook.com/${API_VERSION}/${MEDIA_ID}/comments?`);
  console.log('    access_token=YOUR_TOKEN&');
  console.log('    fields=id,message,from{id,name},created_time,like_count&');
  console.log('    order=reverse_chronological&');
  console.log('    limit=100');
  console.log('');
  
  console.log('2. With User Detection (for platform_user_id: 791805920204092):');
  console.log(`GET https://graph.facebook.com/${API_VERSION}/${MEDIA_ID}/comments?`);
  console.log('    access_token=YOUR_TOKEN&');
  console.log('    fields=id,message,from{id,name},created_time,like_count&');
  console.log('    order=reverse_chronological&');
  console.log('    limit=100');
  console.log('');
  console.log('// Then filter in code:');
  console.log('const targetComments = comments.filter(c => c.from.id === "791805920204092");');
  console.log('');
  
  console.log('3. cURL Command:');
  console.log(`curl "https://graph.facebook.com/${API_VERSION}/${MEDIA_ID}/comments?access_token=YOUR_TOKEN&fields=id,message,from,created_time&order=reverse_chronological&limit=100"`);
  console.log('');
  
  console.log('4. JavaScript Fetch:');
  console.log('const response = await fetch(');
  console.log(`  'https://graph.facebook.com/${API_VERSION}/${MEDIA_ID}/comments?' +`);
  console.log("  'access_token=YOUR_TOKEN&' +");
  console.log("  'fields=id,message,from{id,name},created_time,like_count&' +");
  console.log("  'order=reverse_chronological&' +");
  console.log("  'limit=100'");
  console.log(');');
  console.log('');
}

/**
 * 4. EXPECTED RESPONSE FORMAT
 */
function showExpectedResponse() {
  console.log('📋 Expected Response Format:');
  console.log('');
  
  const exampleResponse = {
    data: [
      {
        id: "comment_id_1",
        message: "This is a comment from user",
        from: {
          id: "791805920204092",
          name: "User Name"
        },
        created_time: "2024-01-15T10:30:00+0000",
        like_count: 5
      },
      {
        id: "comment_id_2", 
        message: "Another comment",
        from: {
          id: "different_user_id",
          name: "Different User"
        },
        created_time: "2024-01-15T09:15:00+0000",
        like_count: 2
      }
    ],
    paging: {
      cursors: {
        before: "cursor_before",
        after: "cursor_after"
      },
      next: "next_page_url"
    }
  };
  
  console.log(JSON.stringify(exampleResponse, null, 2));
  console.log('');
}

/**
 * 5. DETECTION LOGIC FOR TARGET USER
 */
function generateDetectionLogic() {
  console.log('🎯 User Detection Logic:');
  console.log('');
  
  console.log('// Function to find comments from specific user');
  console.log('function findUserComments(commentsData, targetUserId) {');
  console.log('  return commentsData.data.filter(comment => {');
  console.log('    return comment.from && comment.from.id === targetUserId;');
  console.log('  });');
  console.log('}');
  console.log('');
  
  console.log('// Usage for your target user');
  console.log('const TARGET_USER_ID = "791805920204092";');
  console.log('const userComments = findUserComments(apiResponse, TARGET_USER_ID);');
  console.log('');
  console.log('if (userComments.length > 0) {');
  console.log('  console.log(`Found ${userComments.length} comments from target user`);');
  console.log('  userComments.forEach(comment => {');
  console.log('    console.log(`Comment: ${comment.message}`);');
  console.log('    console.log(`Time: ${comment.created_time}`);');
  console.log('  });');
  console.log('} else {');
  console.log('  console.log("No comments found from target user");');
  console.log('}');
  console.log('');
}

/**
 * 6. TROUBLESHOOTING TIPS
 */
function showTroubleshooting() {
  console.log('🔧 Troubleshooting Tips:');
  console.log('');
  
  console.log('Common Issues & Solutions:');
  console.log('');
  console.log('❌ "Invalid OAuth access token"');
  console.log('   ✅ Solution: Get fresh Page Access Token from Graph Explorer');
  console.log('');
  console.log('❌ "Unsupported get request"');
  console.log('   ✅ Solution: Check if media ID is correct and accessible');
  console.log('');
  console.log('❌ "(#200) Insufficient permissions"');
  console.log('   ✅ Solution: Add pages_read_engagement permission to your app');
  console.log('');
  console.log('❌ "Rate limit exceeded"');
  console.log('   ✅ Solution: Implement exponential backoff, check rate limits');
  console.log('');
  console.log('❌ "Comments not showing"');
  console.log('   ✅ Solution: Check user privacy settings, ensure public comments');
  console.log('');
}

/**
 * MAIN EXECUTION
 */
function runAnalysis() {
  analyzeCurrentConfig();
  generateRecommendedConfig();
  generateAPIExamples();
  showExpectedResponse();
  generateDetectionLogic();
  showTroubleshooting();
  
  console.log('✅ Configuration Analysis Complete!');
  console.log('');
  console.log('🎯 Summary:');
  console.log('   • Your basic configuration is correct');
  console.log('   • Add fields parameter for complete data');
  console.log('   • Ensure proper access token');
  console.log('   • Use the detection logic to find specific users');
  console.log('');
}

// Run the analysis
runAnalysis();
