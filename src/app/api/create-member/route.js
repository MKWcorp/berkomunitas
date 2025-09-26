import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No userId found' }, { status: 401 });
    }

    const user = await currentUser();
    
    // Check if member already exists
    const existingMember = await prisma.members.findUnique({
      where: { clerk_id: userId }
    });

    if (existingMember) {
      return NextResponse.json({ 
        success: true, 
        message: 'Member already exists',
        member: existingMember 
      });
    }    // Create new member
    const newMember = await prisma.members.create({
      data: {
        clerk_id: userId,
        nama_lengkap: user.fullName || user.firstName + ' ' + user.lastName || null,
        tanggal_daftar: new Date(),
        loyalty_point: 0
      }
    });

    // Create email record in member_emails table if user has email
    if (user.emailAddresses && user.emailAddresses.length > 0) {
      const primaryEmail = user.primaryEmailAddress || user.emailAddresses[0];
      
      const emailData = user.emailAddresses.map((emailObj) => ({
        clerk_id: userId,
        email: emailObj.emailAddress,
        is_primary: emailObj.id === primaryEmail.id,
        verified: emailObj.verification?.status === 'verified' || false,
      }));

      await prisma.member_emails.createMany({
        data: emailData,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Member created successfully',
      member: newMember
    });

  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
