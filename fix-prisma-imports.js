const fs = require('fs');
const path = require('path');

// List of all files that need to be fixed
const filesToFix = [
  'src/app/api/admin/backfill-clerk-ids/route.js',
  'src/app/api/admin/badges/route.js',
  'src/app/api/admin/badges/[id]/route.js',
  'src/app/api/admin/dashboard/route.js',
  'src/app/api/admin/generate-photos/route.js',
  'src/app/api/admin/levels/route.js',
  'src/app/api/admin/levels/[id]/route.js',
  'src/app/api/admin/member-badges/batch/route.js',
  'src/app/api/admin/member-badges/remove/route.js',
  'src/app/api/admin/member-badges/[id]/route.js',
  'src/app/api/admin/privileges/route.js',
  'src/app/api/admin/privileges/[id]/route.js',
  'src/app/api/admin/rewards/route.js',
  'src/app/api/admin/rewards/[id]/route.js',
  'src/app/api/admin/social-media/route.js',
  'src/app/api/admin/social-media/[id]/route.js',
  'src/app/api/admin/task-submissions/[id]/route.js',
  'src/app/api/admin/tugas/route.js',
  'src/app/api/admin/tugas/[id]/route.js',
  'src/app/api/dashboard/route.js',
  'src/app/api/debug/profile-data/route.js',
  'src/app/api/notifikasi/route.js',
  'src/app/api/profil/check-completeness/route.js',
  'src/app/api/profil/dashboard/route.js',
  'src/app/api/profil/loyalty/route.js',
  'src/app/api/profil/route.js',
  'src/app/api/profile/check-completion/route.js',
  'src/app/api/task-submissions/route.js',
  'src/app/api/task-submissions/timeout/route.js',
  'src/app/api/tugas/route.js',
  'src/app/api/tugas/stats/route.js',
  'src/app/api/user-privileges/route.js'
];

// Function to calculate relative path from file to lib/prisma.js
function getRelativePath(filePath) {
  // Count the number of directories deep from src/app/api/
  const pathParts = filePath.split('/');
  const apiIndex = pathParts.indexOf('api');
  const depth = pathParts.length - apiIndex - 2; // -2 for api and route.js
  
  let relativePath = '';
  for (let i = 0; i < depth; i++) {
    relativePath += '../';
  }
  relativePath += '../../../lib/prisma';
  
  return relativePath;
}

let fixedCount = 0;

filesToFix.forEach(filePath => {
  try {
    console.log(`Processing: ${filePath}`);
    
    // Read file content
    const fullPath = path.join(process.cwd(), filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Calculate correct relative path
    const correctPath = getRelativePath(filePath);
    
    // Replace the incorrect import
    const updatedContent = content.replace(
      /import prisma from ['"]@\/utils\/prisma['"];?/g,
      `import prisma from "${correctPath}";`
    );
    
    // Write back if changed
    if (content !== updatedContent) {
      fs.writeFileSync(fullPath, updatedContent);
      console.log(`✅ Fixed: ${filePath} -> ${correctPath}`);
      fixedCount++;
    } else {
      console.log(`⚠️ No changes needed: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Fixed ${fixedCount} files!`);
