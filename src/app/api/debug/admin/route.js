import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';

export async function GET(_request) {
  try {
    console.log('🔍 Debug Admin API called...');
    
    const { userId } = await auth();
    console.log('Clerk userId:', userId);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        _error: "Tidak terautentikasi",
        debug: { userId: null }
      }, { status: 401 });
    }
    
    // Check if member exists
    const member = await prisma.members.findUnique({ 
      where: { clerk_id: userId },
      include: {
        member_emails: true
      }
    });
    
    console.log('Member found:', member ? {
      id: member._id,
      name: member.name,
      clerk_id: member.clerk_id,
      email: member.member_emails[0]?.email
    } : 'Not found');
    
    if (!member) {
      return NextResponse.json({ 
        success: false, 
        error: "Member tidak ditemukan",
        debug: { userId, memberFound: false }
      }, { status: 404 });
    }
    
    // Check admin privileges
    const privileges = await prisma.user_privileges.findMany({
      where: { 
        clerk_id: userId
      }
    });
    
    console.log('Privileges found:', privileges.map(p => ({
      privilege: p.privilege,
      is_active: p.is_active,
      id: p.id
    })));
    
    const adminPriv = privileges.find(p => p.privilege === 'admin' && p.is_active);
    const isAdmin = !!adminPriv;
    
    return NextResponse.json({ 
      success: true,
      isAdmin: isAdmin,
      member: {
        id: member.id,
        name: member.name,
        email: member.member_emails[0]?.email,
        clerk_id: member.clerk_id
      },
      privileges: privileges.map(p => ({
        privilege: p.privilege,
        is_active: p.is_active,
        granted_at: p.granted_at
      })),
      debug: {
        userId,
        memberFound: true,
        privilegesCount: privileges.length,
        hasActiveAdmin: isAdmin
      }
    });
    
  } catch (___error) {
    console.error("Debug admin error:", ___error);
    return NextResponse.json({ 
      success: false, 
      error: "Server error: " + ___error.message,
      debug: { error: ___error.message }
    }, { status: 500 });
  }
}
