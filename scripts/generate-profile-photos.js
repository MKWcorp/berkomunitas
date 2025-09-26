#!/usr/bin/env node

/**
 * Script untuk generate foto profil otomatis untuk user existing
 * Jalankan dengan: node scripts/generate-profile-photos.js
 */

const { PrismaClient } = require('@prisma/client');
const { clerkClient } = require('@clerk/clerk-sdk-node');

const prisma = new PrismaClient();

// Konfigurasi
const AVATAR_SERVICES = {
  DICEBEAR_AVATAAARS: 'https://api.dicebear.com/7.x/avataaars/svg',
  DICEBEAR_INITIALS: 'https://api.dicebear.com/7.x/initials/svg',
  DICEBEAR_ADVENTURER: 'https://api.dicebear.com/7.x/adventurer/svg',
  DICEBEAR_PERSONAS: 'https://api.dicebear.com/7.x/personas/svg',
  UI_AVATARS: 'https://ui-avatars.com/api'
};

// Pilih service yang akan digunakan
const SELECTED_SERVICE = AVATAR_SERVICES.DICEBEAR_AVATAAARS;

async function generateAvatarUrl(member, service = SELECTED_SERVICE) {
  const seed = member.nama_lengkap || member.clerk_id || `user${member.id}`;
  const encodedSeed = encodeURIComponent(seed.toLowerCase().trim());
  
  switch (service) {
    case AVATAR_SERVICES.DICEBEAR_AVATAAARS:
    case AVATAR_SERVICES.DICEBEAR_INITIALS:
    case AVATAR_SERVICES.DICEBEAR_ADVENTURER:
    case AVATAR_SERVICES.DICEBEAR_PERSONAS:
      return `${service}?seed=${encodedSeed}&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    
    case AVATAR_SERVICES.UI_AVATARS:
      const initials = getInitials(member.nama_lengkap || 'User');
      return `${service}/?name=${initials}&size=200&background=random&color=fff&format=png`;
    
    default:
      return `${AVATAR_SERVICES.DICEBEAR_AVATAAARS}?seed=${encodedSeed}&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }
}

function getInitials(name) {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

async function syncFromClerk(member) {
  try {
    if (!member.clerk_id) {
      console.log(`⚠️  Member ${member.nama_lengkap} tidak memiliki clerk_id`);
      return null;
    }

    const clerkUser = await clerkClient.users.getUser(member.clerk_id);
    
    if (clerkUser.imageUrl && clerkUser.imageUrl !== member.foto_profil_url) {
      console.log(`📸 Sync foto dari Clerk untuk ${member.nama_lengkap}: ${clerkUser.imageUrl}`);
      return clerkUser.imageUrl;
    }
    
    return null;
  } catch (error) {
    console.log(`❌ Error sync Clerk untuk ${member.nama_lengkap}: ${error.message}`);
    return null;
  }
}

async function updateMemberPhoto(memberId, photoUrl, source) {
  try {
    await prisma.members.update({
      where: { id: memberId },
      data: { foto_profil_url: photoUrl }
    });
    
    console.log(`✅ Updated ${memberId}: ${photoUrl} (${source})`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to update ${memberId}: ${error.message}`);
    return false;
  }
}

async function generateProfilePhotos(options = {}) {
  const {
    syncFromClerkFirst = true,
    generateForMissingOnly = true,
    avatarService = SELECTED_SERVICE,
    dryRun = false,
    limit = null
  } = options;

  console.log('🚀 GENERATE PROFILE PHOTOS');
  console.log('==========================');
  console.log(`🔧 Sync from Clerk first: ${syncFromClerkFirst}`);
  console.log(`🎯 Generate for missing only: ${generateForMissingOnly}`);
  console.log(`🎨 Avatar service: ${avatarService}`);
  console.log(`🧪 Dry run: ${dryRun}`);
  console.log('');

  try {
    // Fetch members
    let whereClause = {};
    if (generateForMissingOnly) {
      whereClause = {
        OR: [
          { foto_profil_url: null },
          { foto_profil_url: '' },
          { foto_profil_url: 'https://via.placeholder.com/150' }
        ]
      };
    }

    const members = await prisma.members.findMany({
      where: whereClause,
      take: limit,
      orderBy: { tanggal_daftar: 'desc' }
    });

    console.log(`📊 Found ${members.length} members to process`);
    console.log('');

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const member of members) {
      console.log(`\n👤 Processing: ${member.nama_lengkap} (ID: ${member.id})`);
      console.log(`   Current photo: ${member.foto_profil_url || 'None'}`);

      let newPhotoUrl = null;
      let source = '';

      // Step 1: Try sync from Clerk
      if (syncFromClerkFirst && member.clerk_id) {
        newPhotoUrl = await syncFromClerk(member);
        if (newPhotoUrl) {
          source = 'Clerk';
        }
      }

      // Step 2: Generate avatar if no photo from Clerk
      if (!newPhotoUrl) {
        newPhotoUrl = await generateAvatarUrl(member, avatarService);
        source = 'Generated';
      }

      // Step 3: Update database
      if (newPhotoUrl && !dryRun) {
        const success = await updateMemberPhoto(member.id, newPhotoUrl, source);
        if (success) {
          updated++;
        } else {
          errors++;
        }
      } else if (newPhotoUrl && dryRun) {
        console.log(`🧪 [DRY RUN] Would update: ${newPhotoUrl} (${source})`);
        updated++;
      } else {
        console.log(`⏭️  Skipped: No changes needed`);
        skipped++;
      }
    }

    console.log('\n📈 SUMMARY');
    console.log('===========');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${members.length}`);

    if (dryRun) {
      console.log('\n💡 To apply changes, run without --dry-run flag');
    }

  } catch (error) {
    console.error('❌ Error in generateProfilePhotos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    syncFromClerkFirst: !args.includes('--no-clerk'),
    generateForMissingOnly: !args.includes('--all'),
    dryRun: args.includes('--dry-run'),
    limit: null
  };

  // Parse limit
  const limitIndex = args.findIndex(arg => arg === '--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    options.limit = parseInt(args[limitIndex + 1]);
  }

  // Parse service
  const serviceIndex = args.findIndex(arg => arg === '--service');
  if (serviceIndex !== -1 && args[serviceIndex + 1]) {
    const serviceName = args[serviceIndex + 1].toUpperCase();
    if (AVATAR_SERVICES[serviceName]) {
      options.avatarService = AVATAR_SERVICES[serviceName];
    }
  }

  if (args.includes('--help')) {
    console.log(`
📸 Generate Profile Photos Script

Usage: node scripts/generate-profile-photos.js [options]

Options:
  --dry-run              Preview changes without applying
  --all                  Process all members (not just missing photos)
  --no-clerk             Skip sync from Clerk, only generate avatars
  --limit <number>       Limit number of members to process
  --service <name>       Avatar service to use
  --help                 Show this help

Available Services:
  DICEBEAR_AVATAAARS     Cartoon avatars (default)
  DICEBEAR_INITIALS      Initial-based avatars
  DICEBEAR_ADVENTURER    Adventure-style avatars
  DICEBEAR_PERSONAS      Persona avatars
  UI_AVATARS             UI Avatars service

Examples:
  node scripts/generate-profile-photos.js --dry-run
  node scripts/generate-profile-photos.js --limit 10
  node scripts/generate-profile-photos.js --service DICEBEAR_INITIALS
  node scripts/generate-profile-photos.js --all --no-clerk
    `);
    return;
  }

  await generateProfilePhotos(options);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateProfilePhotos };
