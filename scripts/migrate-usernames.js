/**
 * Migration Script: Create usernames for existing members
 * This script migrates existing members to use the new username system
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateUsernames() {
  console.log('🚀 Starting username migration...');
  
  try {
    // Get all members who don't have usernames yet
    const membersWithoutUsernames = await prisma.members.findMany({
      where: {
        user_usernames: null
      },
      include: {
        profil_sosial_media: true
      }
    });

    console.log(`📊 Found ${membersWithoutUsernames.length} members without usernames`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const member of membersWithoutUsernames) {
      try {
        let username = null;
        
        // Try to get username from social media profiles (preferably Instagram or primary)
        if (member.profil_sosial_media && member.profil_sosial_media.length > 0) {
          // Prefer Instagram username, then first available
          const instagramProfile = member.profil_sosial_media.find(p => p.platform.toLowerCase() === 'instagram');
          const primaryProfile = instagramProfile || member.profil_sosial_media[0];
          
          if (primaryProfile.username_sosmed) {
            username = primaryProfile.username_sosmed.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '');
            
            // Ensure username is at least 3 characters
            if (username.length < 3) {
              username = `user_${member.id}`;
            }
          }
        }
        
        // Fallback to user_id if no social media username
        if (!username) {
          username = `user_${member.id}`;
        }

        // Check if username already exists and make it unique
        let finalUsername = username;
        let counter = 1;
        
        while (true) {
          const existing = await prisma.user_usernames.findUnique({
            where: { username: finalUsername }
          });
          
          if (!existing) {
            break;
          }
          
          finalUsername = `${username}_${counter}`;
          counter++;
        }

        // Create the username entry
        await prisma.user_usernames.create({
          data: {
            member_id: member.id,
            username: finalUsername,
            display_name: member.nama_lengkap || null,
            is_custom: false // Mark as auto-generated
          }
        });

        console.log(`✅ Created username for member ${member.id}: ${finalUsername}`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Error creating username for member ${member.id}:`, error);
        skippedCount++;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${migratedCount} members`);
    console.log(`⚠️ Skipped due to errors: ${skippedCount} members`);
    
    // Show some statistics
    const totalUsernames = await prisma.user_usernames.count();
    console.log(`📈 Total usernames in system: ${totalUsernames}`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateUsernames()
    .then(() => {
      console.log('✨ Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateUsernames };
