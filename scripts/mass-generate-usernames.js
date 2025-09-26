import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate unique username for member (Script version)
 */
async function generateUniqueUsername(memberId, displayName = null) {
  try {
    // Strategy 1: user_[id]
    let username = `user_${memberId}`;
    
    // Check if username exists
    let existingUsername = await prisma.user_usernames.findFirst({
      where: { username }
    });
    
    // Strategy 2: If conflict, use member_[timestamp]
    if (existingUsername) {
      username = `member_${Date.now()}`;
      
      existingUsername = await prisma.user_usernames.findFirst({
        where: { username }
      });
    }
    
    // Strategy 3: If still conflict, add random number
    let attempts = 0;
    while (existingUsername && attempts < 10) {
      const randomNum = Math.floor(Math.random() * 10000);
      username = `user_${memberId}_${randomNum}`;
      
      existingUsername = await prisma.user_usernames.findFirst({
        where: { username }
      });
      attempts++;
    }
    
    // Final fallback: timestamp + random
    if (existingUsername) {
      username = `member_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    console.log(`Generated username: ${username} for member ID: ${memberId}`);
    return username;
    
  } catch (error) {
    console.error('Error generating username:', error);
    // Emergency fallback
    return `user_${memberId}_${Date.now()}`;
  }
}

/**
 * Create username entry for member (Script version)
 */
async function createUsernameForMember(memberId, displayName = null) {
  try {
    // Check if member already has username
    const existingUsername = await prisma.user_usernames.findFirst({
      where: { member_id: memberId }
    });
    
    if (existingUsername) {
      console.log(`Member ${memberId} already has username: ${existingUsername.username}`);
      return existingUsername;
    }
    
    // Generate unique username
    const username = await generateUniqueUsername(memberId, displayName);
    
    // Create username record
    const newUsername = await prisma.user_usernames.create({
      data: {
        member_id: memberId,
        username: username,
        display_name: displayName || `User ${memberId}`,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log(`Created username ${username} for member ${memberId}`);
    return newUsername;
    
  } catch (error) {
    console.error('Error creating username for member:', error);
    throw error;
  }
}

async function massGenerateUsernames() {
  console.log('🚀 Starting mass username generation...');
  
  try {
    // Find all members who don't have usernames
    const membersWithoutUsernames = await prisma.members.findMany({
      where: {
        user_usernames: null
      },
      select: {
        id: true,
        nama_lengkap: true,
        clerk_id: true
      }
    });

    console.log(`📊 Found ${membersWithoutUsernames.length} members without usernames`);

    if (membersWithoutUsernames.length === 0) {
      console.log('✅ All members already have usernames!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each member
    for (const member of membersWithoutUsernames) {
      try {
        console.log(`🔄 Processing member ${member.id}: ${member.nama_lengkap || member.clerk_id || 'Unknown'}`);
        
        const usernameRecord = await createUsernameForMember(
          member.id,
          member.nama_lengkap || `User ${member.id}`
        );
        
        console.log(`✅ Created username "${usernameRecord.username}" for member ${member.id}`);
        successCount++;
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error creating username for member ${member.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Mass generation completed!');
    console.log(`✅ Success: ${successCount} usernames created`);
    console.log(`❌ Errors: ${errorCount} failed`);
    console.log(`📊 Total processed: ${membersWithoutUsernames.length} members`);

    // Verify results
    const remainingMembers = await prisma.members.count({
      where: {
        user_usernames: null
      }
    });

    console.log(`🔍 Remaining members without usernames: ${remainingMembers}`);

  } catch (error) {
    console.error('💥 Fatal error during mass generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
massGenerateUsernames()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
