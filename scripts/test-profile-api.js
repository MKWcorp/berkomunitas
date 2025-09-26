/**
 * Test script untuk menguji Profile API dengan struktur multi-email baru
 * 
 * Script ini akan:
 * 1. Test membuat member baru
 * 2. Test mengupdate data member
 * 3. Test sinkronisasi email
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProfileAPI() {
  console.log('🧪 Testing Profile API with Multi-Email Structure\n');

  try {
    // Test 1: Membuat member dummy untuk testing
    console.log('1️⃣ Testing member creation...');
    
    const testClerkId = 'test_clerk_user_123';
    
    // Hapus data test jika ada
    await prisma.member_emails.deleteMany({
      where: { clerk_id: testClerkId }
    });
    await prisma.members.deleteMany({
      where: { clerk_id: testClerkId }
    });

    // Simulasi create member (seperti yang dilakukan API profil)
    const member = await prisma.$transaction(async (tx) => {
      // Create member
      const newMember = await tx.members.create({
        data: {
          clerk_id: testClerkId,
          nama_lengkap: 'Test User',
          nomer_wa: '081234567890'
        }
      });

      // Create member emails
      await tx.member_emails.createMany({
        data: [
          {
            clerk_id: testClerkId,
            email: 'test@example.com',
            verified: true,
            is_primary: true
          },
          {
            clerk_id: testClerkId,
            email: 'test2@example.com',
            verified: false,
            is_primary: false
          }
        ]
      });

      return newMember;
    });

    console.log('✅ Member created successfully:', {
      id: member.id,
      clerk_id: member.clerk_id,
      nama_lengkap: member.nama_lengkap
    });

    // Test 2: Retrieve member dengan emails
    console.log('\n2️⃣ Testing member retrieval with emails...');
    
    const memberWithEmails = await prisma.members.findUnique({
      where: { clerk_id: testClerkId },
      include: {
        member_emails: {
          orderBy: [
            { is_primary: 'desc' },
            { verified: 'desc' }
          ]
        }
      }
    });

    console.log('✅ Member retrieved successfully:', {
      id: memberWithEmails.id,
      emails: memberWithEmails.member_emails.map(e => ({
        email: e.email,
        verified: e.verified,
        is_primary: e.is_primary
      })),
      primary_email: memberWithEmails.member_emails.find(e => e.is_primary)?.email
    });

    // Test 3: Email synchronization (simulasi update dari Clerk)
    console.log('\n3️⃣ Testing email synchronization...');
    
    // Simulasi update email dari Clerk webhook
    const newEmails = [
      { email: 'test@example.com', verified: true }, // existing, now verified
      { email: 'test3@example.com', verified: true }  // new email
      // test2@example.com removed
    ];
    const primaryEmail = 'test3@example.com';

    await prisma.$transaction(async (tx) => {
      const currentEmails = memberWithEmails.member_emails;
      
      // Create email diff
      const currentEmailSet = new Set(currentEmails.map(e => e.email));
      const newEmailSet = new Set(newEmails.map(e => e.email));

      // Remove emails that are no longer in the list
      const emailsToRemove = currentEmails.filter(e => !newEmailSet.has(e.email));
      if (emailsToRemove.length > 0) {
        await tx.member_emails.deleteMany({
          where: {
            clerk_id: testClerkId,
            email: { in: emailsToRemove.map(e => e.email) }
          }
        });
        console.log('🗑️ Removed emails:', emailsToRemove.map(e => e.email));
      }

      // Add new emails
      const emailsToAdd = newEmails.filter(e => !currentEmailSet.has(e.email));
      if (emailsToAdd.length > 0) {
        await tx.member_emails.createMany({
          data: emailsToAdd.map(email => ({
            clerk_id: testClerkId,
            email: email.email,
            verified: email.verified,
            is_primary: email.email === primaryEmail
          }))
        });
        console.log('➕ Added emails:', emailsToAdd.map(e => e.email));
      }

      // Update existing emails
      for (const newEmail of newEmails) {
        if (currentEmailSet.has(newEmail.email)) {
          await tx.member_emails.updateMany({
            where: {
              clerk_id: testClerkId,
              email: newEmail.email
            },
            data: {
              verified: newEmail.verified,
              is_primary: newEmail.email === primaryEmail
            }
          });
        }
      }

      // Reset all emails to not primary first
      await tx.member_emails.updateMany({
        where: { clerk_id: testClerkId },
        data: { is_primary: false }
      });

      // Set the primary email
      await tx.member_emails.updateMany({
        where: {
          clerk_id: testClerkId,
          email: primaryEmail
        },
        data: { is_primary: true }
      });
    });

    // Verify the sync
    const syncedMember = await prisma.members.findUnique({
      where: { clerk_id: testClerkId },
      include: {
        member_emails: {
          orderBy: [
            { is_primary: 'desc' },
            { verified: 'desc' }
          ]
        }
      }
    });

    console.log('✅ Email sync completed:', {
      emails: syncedMember.member_emails.map(e => ({
        email: e.email,
        verified: e.verified,
        is_primary: e.is_primary
      })),
      primary_email: syncedMember.member_emails.find(e => e.is_primary)?.email
    });

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.member_emails.deleteMany({
      where: { clerk_id: testClerkId }
    });
    await prisma.members.deleteMany({
      where: { clerk_id: testClerkId }
    });

    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testProfileAPI().catch(console.error);
