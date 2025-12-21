import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 });
    }
    
    // Check if member already exists
    const existingMember = await prisma.members.findUnique({
      where: { id: user.id }
    });

    if (existingMember) {
      return NextResponse.json({ 
        success: true, 
        message: 'Member already exists',
        member: existingMember 
      });
    }

    // Create new member
    const newMember = await prisma.members.create({
      data: {
        google_id: user.google_id,
        nama_lengkap: user.name || null,
        email: user.email,
        tanggal_daftar: new Date(),
        loyalty_point: 0
      }
    });

    // Create email record in member_emails table if user has email
    if (user.email) {
      await prisma.member_emails.create({
        data: {
          member_id: newMember.id,
          email: user.email,
          is_primary: true,
          verified: true, // Google emails are pre-verified
        }
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
