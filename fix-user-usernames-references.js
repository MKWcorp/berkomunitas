// Fix user_usernames relation field references across all API files
const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/api/profil/username/route.js',
  'src/app/api/profil/sosial-media/route.js', 
  'src/app/api/profil/sosial-media/check-availability/route.js'
];

function fixUserUsernamesReferences(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace include references
    content = content.replace(/user_usernames:\s*true/g, 'user_usernames_relation: true');
    
    // Replace access references - careful with different patterns
    content = content.replace(/member\.user_usernames/g, 'member.user_usernames_relation?.[0]');
    content = content.replace(/updatedMember\.user_usernames/g, 'updatedMember.user_usernames_relation?.[0]');
    content = content.replace(/existingMember\.user_usernames/g, 'existingMember.user_usernames_relation?.[0]');
    
    // Fix conditional checks
    content = content.replace(/!member\.user_usernames_relation\?\.\[0\]/g, '!member.user_usernames_relation?.[0]');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Fix each file
filesToFix.forEach(fixUserUsernamesReferences);

console.log('\n🎯 All user_usernames references have been updated to user_usernames_relation!');
