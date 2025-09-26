const fs = require('fs');
const path = require('path');

console.log('🚀 Pre-deployment validation starting...\n');

// Check 1: Cek apakah ada file yang masih menggunakan user_email
console.log('🔍 Checking for old user_email references...');
const checkFiles = [
  'src/app/api',
  'src/utils',
  'lib'
];

let hasErrors = false;

// Simple check for user_email in JavaScript files
function checkDirectory(dir) {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        checkDirectory(fullPath);
      } else if (file.name.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        if (content.includes('user_email') && !fullPath.includes('migration')) {
          console.log(`❌ ERROR: ${fullPath} still uses 'user_email'`);
          hasErrors = true;
        }
        
        if (content.includes('@/utils/prisma')) {
          console.log(`❌ ERROR: ${fullPath} uses old import path '@/utils/prisma'`);
          hasErrors = true;
        }
        
        if (content.includes('adminAuth')) {
          console.log(`⚠️  WARNING: ${fullPath} still references old adminAuth`);
        }
      }
    });
  } catch (error) {
    // Directory might not exist
  }
}

checkFiles.forEach(checkDirectory);

// Check 2: Prisma schema
console.log('\n🔍 Checking Prisma schema...');
try {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
  
  if (!schema.includes('clerk_id')) {
    console.log('❌ ERROR: Prisma schema missing clerk_id field');
    hasErrors = true;
  }
  
  if (schema.includes('clerkId') && !schema.includes('clerk_id')) {
    console.log('❌ ERROR: Prisma schema still uses camelCase clerkId instead of clerk_id');
    hasErrors = true;
  }
  
  console.log('✅ Prisma schema looks good');
} catch (error) {
  console.log('❌ ERROR: Could not read Prisma schema');
  hasErrors = true;
}

// Check 3: Package.json
console.log('\n🔍 Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  
  if (!packageJson.scripts || !packageJson.scripts.build) {
    console.log('❌ ERROR: package.json missing build script');
    hasErrors = true;
  }
  
  const criticalDeps = ['@clerk/nextjs', '@prisma/client', 'next'];
  for (const dep of criticalDeps) {
    if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
      console.log(`❌ ERROR: Missing critical dependency: ${dep}`);
      hasErrors = true;
    }
  }
  
  console.log('✅ Package.json looks good');
} catch (error) {
  console.log('❌ ERROR: Could not read package.json');
  hasErrors = true;
}

// Final result
console.log('\n📋 Validation Results:');

if (!hasErrors) {
  console.log('✅ All checks passed! Ready to deploy to Vercel.');
  console.log('\n🚀 Next steps:');
  console.log('1. Push code to GitHub: git add . && git commit -m "ready for deployment" && git push');
  console.log('2. Deploy to Vercel');
  console.log('3. Set environment variables in Vercel dashboard');
  console.log('4. Run database migration if needed');
} else {
  console.log('❌ Please fix the errors above before deploying.');
  process.exit(1);
}
