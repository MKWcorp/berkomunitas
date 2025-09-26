#!/usr/bin/env node

/**
 * Script untuk fix broken avatar URLs yang menggunakan backgroundColor=random
 * Jalankan dengan: node scripts/fix-broken-avatar-urls.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Function to fix avatar URL
function fixAvatarUrl(brokenUrl) {
  if (!brokenUrl || !brokenUrl.includes('backgroundColor=random')) {
    return brokenUrl; // No need to fix
  }
  
  // Replace backgroundColor=random with proper color palette
  return brokenUrl.replace(
    'backgroundColor=random', 
    'backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf'
  );
}

async function fixBrokenAvatarUrls() {
  console.log('🔧 FIXING BROKEN AVATAR URLs');
  console.log('=============================');

  try {
    // Find members with broken backgroundColor=random URLs
    const brokenMembers = await prisma.members.findMany({
      where: {
        foto_profil_url: {
          contains: 'backgroundColor=random'
        }
      },
      select: {
        id: true,
        nama_lengkap: true,
        foto_profil_url: true
      }
    });

    console.log(`📊 Found ${brokenMembers.length} members with broken avatar URLs`);
    
    if (brokenMembers.length === 0) {
      console.log('✅ No broken URLs found! All avatar URLs are correct.');
      return;
    }

    console.log('');

    let fixed = 0;

    for (const member of brokenMembers) {
      console.log(`👤 Fixing: ${member.nama_lengkap} (ID: ${member.id})`);
      console.log(`❌ Broken URL: ${member.foto_profil_url}`);
      
      const fixedUrl = fixAvatarUrl(member.foto_profil_url);
      console.log(`✅ Fixed URL: ${fixedUrl}`);

      try {
        // Update database dengan URL yang sudah diperbaiki
        await prisma.members.update({
          where: { id: member.id },
          data: { foto_profil_url: fixedUrl }
        });
        
        console.log(`✅ Database updated successfully`);
        fixed++;
      } catch (error) {
        console.log(`❌ Failed to update database: ${error.message}`);
      }
      
      console.log('');
    }

    console.log('📈 SUMMARY');
    console.log('===========');
    console.log(`✅ Successfully fixed: ${fixed}/${brokenMembers.length} URLs`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Test URL fix function
function testUrlFix() {
  console.log('🧪 Testing URL fix function...');
  
  const testCases = [
    {
      input: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john&size=200&backgroundColor=random',
      expected: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf'
    },
    {
      input: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
      expected: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf'
    }
  ];
  
  testCases.forEach((testCase, index) => {
    const result = fixAvatarUrl(testCase.input);
    const passed = result === testCase.expected;
    console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    if (!passed) {
      console.log(`  Expected: ${testCase.expected}`);
      console.log(`  Got:      ${result}`);
    }
  });
  console.log('');
}

// Run tests first, then fix URLs
if (process.argv.includes('--test')) {
  testUrlFix();
} else {
  fixBrokenAvatarUrls();
}
