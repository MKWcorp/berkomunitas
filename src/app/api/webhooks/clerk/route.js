import prisma from '@/lib/prisma';
import { Webhook } from 'svix'
import { headers } from 'next/headers'
export async function POST(req) {
  // Get webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If no headers, return error
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400
    })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Create Svix instance with secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) 
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400
    })
  }

  // Get event type
  const eventType = evt.type;

  try {
    // Handle user.created event
    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name } = evt.data;
      const nama_lengkap = [first_name, last_name].filter(Boolean).join(' ') || 'User';

      // Use transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // Upsert member record: create if not exists, do nothing if it does
        const member = await tx.members.upsert({
          where: { google_id: id },
          update: {
            // You can update fields here if the user might already exist 
            // but needs an update on creation event. For now, we leave it empty.
            nama_lengkap: nama_lengkap,
          },
          create: { google_id: id,
            nama_lengkap: nama_lengkap,
            tanggal_daftar: new Date(),
            // Set initial loyalty points or other defaults here
            loyalty_point: 0,
          },
        });

        // Email synchronization logic
        if (email_addresses && email_addresses.length > 0) {
          const primaryEmailInfo = email_addresses.find(e => e.id === evt.data.primary_email_address_id) || email_addresses[0];
          
          // Get existing emails to avoid re-creating them
          const existingEmails = await tx.member_emails.findMany({
            where: { google_id: id },
            select: { email: true }
          });
          const existingEmailSet = new Set(existingEmails.map(e => e.email));

          const emailData = email_addresses
            .filter(emailObj => !existingEmailSet.has(emailObj.email_address))
            .map((emailObj) => ({
              google_id: id,
              email: emailObj.email_address,
              is_primary: emailObj.id === primaryEmailInfo.id,
              verified: emailObj.verification?.status === 'verified' || false,
            }));          if (emailData.length > 0) {
            await tx.member_emails.createMany({
              data: emailData,
              skipDuplicates: true,
            });
          }
        }

        // Auto-assign default user privilege if not already assigned
        const existingPrivilege = await tx.user_privileges.findFirst({
          where: { google_id: id }
        });

        if (!existingPrivilege) {
          await tx.user_privileges.create({
            data: { google_id: id,
              privilege: 'user',
              is_active: true,
              granted_at: new Date(),
              granted_by: 'system'
            }
          });
        }

        // Auto-generate profile photo if not exists
        if (!member.foto_profil_url || member.foto_profil_url === 'https://via.placeholder.com/150') {
          const seed = nama_lengkap || `user${member.id}`;
          const encodedSeed = encodeURIComponent(seed.toLowerCase().trim());
          const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedSeed}&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
          
          await tx.members.update({
            where: { id: member.id },
            data: { foto_profil_url: avatarUrl }
          });
          
          console.log(`🎨 Generated avatar for ${nama_lengkap}: ${avatarUrl}`);
        }
      });

      console.log(`✅ User created: ${id} with ${email_addresses?.length || 0} email(s)`);
    }

    // Handle user.updated event
    if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = evt.data;
      const nama_lengkap = [first_name, last_name].filter(Boolean).join(' ') || 'User';

      // Use transaction for email synchronization
      await prisma.$transaction(async (tx) => {
        // Update member record
        await tx.members.update({
          where: { google_id: id },
          data: {
            nama_lengkap: nama_lengkap,
          },
        });

        if (email_addresses && email_addresses.length > 0) {
          // Get current emails from database
          const currentEmails = await tx.member_emails.findMany({
            where: { google_id: id },
          });

          const currentEmailAddresses = currentEmails.map(e => e.email);
          const newEmailAddresses = email_addresses.map(e => e.email_address);

          // Find emails to add
          const emailsToAdd = email_addresses.filter(
            emailObj => !currentEmailAddresses.includes(emailObj.email_address)
          );

          // Find emails to remove
          const emailsToRemove = currentEmails.filter(
            emailRecord => !newEmailAddresses.includes(emailRecord.email)
          );

          // Add new emails
          if (emailsToAdd.length > 0) {
            // Find primary email (first verified email or first email if none verified)
            const primaryEmail = email_addresses.find(e => e.verification?.status === 'verified') || email_addresses[0];
            
            const emailData = emailsToAdd.map((emailObj) => ({
              google_id: id,
              email: emailObj.email_address,
              is_primary: emailObj.id === primaryEmail.id,
              verified: emailObj.verification?.status === 'verified' || false,
            }));

            await tx.member_emails.createMany({
              data: emailData,
              skipDuplicates: true,
            });
          }

          // Remove deleted emails
          if (emailsToRemove.length > 0) {
            await tx.member_emails.deleteMany({
              where: { google_id: id,
                email: {
                  in: emailsToRemove.map(e => e.email)
                }
              }
            });
          }

          // Update existing emails (is_primary and verified status)
          const primaryEmail = email_addresses.find(e => e.verification?.status === 'verified') || email_addresses[0];
          
          for (const emailObj of email_addresses) {
            const existingEmail = currentEmails.find(e => e.email === emailObj.email_address);
            if (existingEmail) {
              await tx.member_emails.update({
                where: { id: existingEmail.id },
                data: {
                  is_primary: emailObj.id === primaryEmail.id,
                  verified: emailObj.verification?.status === 'verified' || false,
                }
              });
            }
          }
        }
      });

      console.log(`🔄 User updated: ${id} with ${email_addresses?.length || 0} email(s)`);
    }

    // Handle user.deleted event
    if (eventType === 'user.deleted') {
      const { id } = evt.data;
      if (id) {
        // Delete member (CASCADE will automatically delete member_emails and user_privileges)
        await prisma.members.delete({
          where: { google_id: id,
          },
        });
        console.log(`🗑️ User deleted: ${id}`);
      }
    }

    return new Response('', { status: 200 });

  } catch (dbError) {
    console.error('❌ Webhook DB Error:', dbError);
    
    // Handle specific error types
    if (dbError.code === 'P2002') {
      console.error('Unique constraint violation:', dbError.meta);
      return new Response('Duplicate entry error', { status: 409 });
    }
    
    if (dbError.code === 'P2025') {
      console.error('Record not found:', dbError.meta);
      return new Response('Record not found', { status: 404 });
    }
    
    // Return a more specific error message if possible
    return new Response(`Database error: ${dbError.message}`, { status: 500 });
  } finally {
    // Ensure Prisma connection is closed
    await prisma.$disconnect();
  }
}