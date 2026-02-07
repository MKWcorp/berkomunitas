import prisma from '@/lib/prisma';

/**
 * Generate unique username for member
 * @param {number} memberId - ID member
 * @param {string} displayName - Nama display member (optional)
 * @returns {Promise<string>} - Generated unique username
 */
export async function generateUniqueUsername(memberId, displayName = null) {
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
 * Create username entry for member
 * @param {number} memberId - ID member
 * @param {string} displayName - Display name
 * @returns {Promise<object>} - Created username record
 */
export async function createUsernameForMember(memberId, displayName = null) {
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

/**
 * Auto-generate username for member if they don't have one
 * @param {number} memberId - ID member
 * @returns {Promise<string>} - Username (existing or newly generated)
 */
export async function ensureMemberHasUsername(memberId) {
  try {
    // Check if member has username
    const existingUsername = await prisma.user_usernames.findFirst({
      where: { member_id: memberId }
    });
    
    if (existingUsername) {
      return existingUsername.username;
    }
    
    // Get member info
    const member = await prisma.members.findUnique({
      where: { id: memberId }
    });
    
    if (!member) {
      throw new Error(`Member with ID ${memberId} not found`);
    }
    
    // Create username
    const usernameRecord = await createUsernameForMember(
      memberId, 
      member.nama_lengkap || `User ${memberId}`
    );
    
    return usernameRecord.username;
    
  } catch (error) {
    console.error('Error ensuring member has username:', error);
    throw error;
  }
}
