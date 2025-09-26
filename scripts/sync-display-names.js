/**
 * Update Display Names: Sync display_name with nama_lengkap
 * This script updates all existing user_usernames to use nama_lengkap as display_name
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDisplayNames() {
  console.log('🚀 Starting display name sync...');
  
  try {
    // Get all user_usernames with their member data
    const usernames = await prisma.user_usernames.findMany({
      include: {
        members: true
      }
    });

    console.log(`📊 Found ${usernames.length} username records to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const userUsername of usernames) {
      try {
        const newDisplayName = userUsername.members.nama_lengkap || null;
        
        // Update display_name to match nama_lengkap
        await prisma.user_usernames.update({
          where: { id: userUsername.id },
          data: {
            display_name: newDisplayName
          }
        });

        console.log(`✅ Updated ${userUsername.username}: "${newDisplayName}"`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Error updating ${userUsername.username}:`, error);
        skippedCount++;
      }
    }

    console.log(`\n🎉 Display name sync completed!`);
    console.log(`✅ Successfully updated: ${updatedCount} records`);
    console.log(`⚠️ Skipped due to errors: ${skippedCount} records`);

  } catch (error) {
    console.error('💥 Sync failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
if (require.main === module) {
  updateDisplayNames()
    .then(() => {
      console.log('✨ Display name sync script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Display name sync script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateDisplayNames };
