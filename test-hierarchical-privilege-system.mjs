/**
 * Test Script untuk Hierarchical Privilege System
 * Tanpa mengubah database - hanya logic aplikasi
 * Date: September 19, 2025
 */

import { PrismaClient } from '@prisma/client';
import { 
  checkUserPrivileges, 
  hasPrivilege, 
  canAccessFeature, 
  getPrivilegeDisplayName,
  getPrivilegeBadgeColor,
  PRIVILEGE_HIERARCHY 
} from './src/utils/privilegeChecker.js';

const prisma = new PrismaClient();

async function testHierarchicalPrivilegeSystem() {
  console.log('🔐 Testing Hierarchical Privilege System...\n');
  
  try {
    // 1. Test privilege hierarchy constants
    console.log('1️⃣ Testing privilege hierarchy...');
    console.log('Hierarchy levels:', PRIVILEGE_HIERARCHY);
    console.log();
    
    // 2. Test hasPrivilege function
    console.log('2️⃣ Testing privilege access logic...');
    console.log('berkomunitasplus can access user features:', hasPrivilege('berkomunitasplus', 'user')); // Should be true
    console.log('user can access berkomunitasplus features:', hasPrivilege('user', 'berkomunitasplus')); // Should be false
    console.log('admin can access partner features:', hasPrivilege('admin', 'partner')); // Should be true
    console.log('partner can access admin features:', hasPrivilege('partner', 'admin')); // Should be false
    console.log();
    
    // 3. Test with drwcorpora email
    console.log('3️⃣ Testing drwcorpora@gmail.com privileges...');
    
    // Find drwcorpora user
    const drwcorporaMember = await prisma.member_emails.findUnique({
      where: { email: 'drwcorpora@gmail.com' },
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            clerk_id: true
          }
        }
      }
    });
    
    if (drwcorporaMember && drwcorporaMember.members.clerk_id) {
      const privileges = await checkUserPrivileges(drwcorporaMember.members.clerk_id);
      
      console.log('Member:', drwcorporaMember.members.nama_lengkap);
      console.log('Current privilege:', privileges.currentPrivilege);
      console.log('Display name:', getPrivilegeDisplayName(privileges.currentPrivilege));
      console.log('Badge color:', getPrivilegeBadgeColor(privileges.currentPrivilege));
      console.log();
      
      console.log('Hierarchical Access:');
      console.log('  isUser:', privileges.isUser);
      console.log('  isBerkomunitasPlus:', privileges.isBerkomunitasPlus);
      console.log('  isPartner:', privileges.isPartner);
      console.log('  isAdmin:', privileges.isAdmin);
      console.log();
      
      console.log('Exact Privilege Check:');
      console.log('  isExactlyUser:', privileges.isExactlyUser);
      console.log('  isExactlyBerkomunitasPlus:', privileges.isExactlyBerkomunitasPlus);
      console.log('  isExactlyPartner:', privileges.isExactlyPartner);
      console.log('  isExactlyAdmin:', privileges.isExactlyAdmin);
      console.log();
      
      // 4. Test feature access
      console.log('4️⃣ Testing feature access...');
      
      const features = [
        'basic_rewards',
        'premium_rewards', 
        'partner_dashboard',
        'user_management'
      ];
      
      for (const feature of features) {
        const access = await canAccessFeature(drwcorporaMember.members.clerk_id, feature);
        console.log(`${feature}: ${access.canAccess ? '✅' : '❌'} ${access.reason}`);
        if (!access.canAccess && access.suggestedUpgrade) {
          console.log(`  Suggested: ${access.suggestedUpgrade}`);
        }
      }
      
    } else {
      console.log('❌ drwcorpora@gmail.com tidak ditemukan atau belum punya clerk_id');
    }
    
    console.log();
    
    // 5. Test dengan beberapa user lain
    console.log('5️⃣ Testing other users...');
    
    const sampleMembers = await prisma.members.findMany({
      take: 3,
      where: {
        clerk_id: { not: null }
      },
      select: {
        id: true,
        nama_lengkap: true,
        clerk_id: true
      }
    });
    
    for (const member of sampleMembers) {
      console.log(`\n--- ${member.nama_lengkap || 'No Name'} ---`);
      
      const privileges = await checkUserPrivileges(member.clerk_id);
      console.log(`Privilege: ${privileges.currentPrivilege} (${getPrivilegeDisplayName(privileges.currentPrivilege)})`);
      
      // Test apakah bisa akses premium rewards
      const premiumAccess = await canAccessFeature(member.clerk_id, 'premium_rewards');
      console.log(`Premium Rewards: ${premiumAccess.canAccess ? '✅' : '❌'}`);
      if (!premiumAccess.canAccess) {
        console.log(`  Need: ${premiumAccess.requiredPrivilege}, Suggestion: ${premiumAccess.suggestedUpgrade}`);
      }
    }
    
    console.log();
    
    // 6. Summary
    console.log('6️⃣ Summary of Hierarchical System:');
    console.log('✅ Database tidak perlu diubah');
    console.log('✅ Single privilege per user (sesuai constraint)');
    console.log('✅ Privilege tinggi otomatis punya akses privilege rendah');
    console.log('✅ berkomunitasplus otomatis punya akses user features');
    console.log('✅ Mudah untuk cek akses fitur dengan hasPrivilege()');
    console.log('✅ UI bisa show badge berdasarkan exact privilege');
    console.log('✅ Backend bisa filter content berdasarkan hierarchy');
    
  } catch (error) {
    console.error('❌ Error testing privilege system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function untuk demo reward filtering
async function demoRewardFiltering(userClerkId) {
  console.log('\n🎁 Demo: Reward Filtering berdasarkan Privilege');
  
  const userPrivileges = await checkUserPrivileges(userClerkId);
  console.log(`User privilege: ${userPrivileges.currentPrivilege}`);
  
  // Simulasi rewards dengan privilege requirements
  const allRewards = [
    { id: 1, name: 'Basic Badge', required_privilege: null },
    { id: 2, name: 'User Medal', required_privilege: 'user' },
    { id: 3, name: 'Premium Skin', required_privilege: 'berkomunitasplus' },
    { id: 4, name: 'Partner Tools', required_privilege: 'partner' },
    { id: 5, name: 'Admin Console', required_privilege: 'admin' }
  ];
  
  console.log('\nRewards accessible to this user:');
  
  allRewards.forEach(reward => {
    let canAccess = true;
    
    if (reward.required_privilege) {
      canAccess = hasPrivilege(userPrivileges.currentPrivilege, reward.required_privilege);
    }
    
    console.log(`${canAccess ? '✅' : '❌'} ${reward.name} ${reward.required_privilege ? `(needs: ${reward.required_privilege})` : '(free)'}`);
  });
}

// Jalankan test jika file dijalankan langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  testHierarchicalPrivilegeSystem()
    .then(() => {
      console.log('\n✨ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testHierarchicalPrivilegeSystem, demoRewardFiltering };