/**
 * Migration Script: Link Clerk Users to SSO
 * 
 * Tujuan:
 * - Update user lama (Clerk) dengan email dari tabel member_emails
 * - Mempersiapkan mereka untuk login dengan Google SSO
 * - Data lama tetap utuh (clerk_id tetap tersimpan untuk backward compatibility)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateClerkUsersToSSO() {
  console.log('🚀 Starting Clerk to SSO Migration...\n');

  try {
    // 1. Get all users with clerk_id but no email
    const usersWithoutEmail = await prisma.members.findMany({
      where: { google_id: { not: null },
        email: null,
      },
      select: {
        id: true,
        google_id: true,
        nama_lengkap: true,
      },
    });

    console.log(`📊 Found ${usersWithoutEmail.length} users with Clerk ID but no email\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of usersWithoutEmail) {
      try {
        // 2. Find email from member_emails table
        const emailRecord = await prisma.member_emails.findFirst({
          where: { google_id: user.clerk_id,
            is_primary: true, // Prioritas email primary
          },
        });

        // If no primary email, get any email
        const anyEmail = emailRecord || await prisma.member_emails.findFirst({
          where: { google_id: user.clerk_id },
        });

        if (anyEmail) {
          // 3. Update members table with email
          await prisma.members.update({
            where: { id: user.id },
            data: {
              email: anyEmail.email,
              sso_metadata: {
                migratedFromClerk: true,
                clerkId: user.clerk_id,
                migrationDate: new Date().toISOString(),
                readyForGoogleSSO: true,
              },
            },
          });

          updated++;
          console.log(`✅ Updated user ${user.id} (${user.nama_lengkap || 'No Name'}) - Email: ${anyEmail.email}`);
        } else {
          skipped++;
          console.log(`⚠️  Skipped user ${user.id} (${user.nama_lengkap || 'No Name'}) - No email found in member_emails`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error updating user ${user.id}:`, error.message);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⚠️  Skipped: ${skipped} (no email found)`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('\n🎉 Migration completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. User lama sekarang sudah punya email di tabel members');
    console.log('   2. Ketika mereka login dengan Google (pakai email yang sama), sistem akan auto-link dengan google_id');
    console.log('   3. Data lama mereka (coin, loyalty_point, dll) tetap utuh!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateClerkUsersToSSO();
