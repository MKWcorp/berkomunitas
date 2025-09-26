import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';

export async function GET(_request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        isAdmin: false,
        _error: "Tidak terautentikasi" 
      }, { status: 401 });
    }
    
    // Check if member exists
    const member = await prisma.members.findUnique({ 
      where: { clerk_id: userId }
    });
    
    if (!member) {
      return NextResponse.json({ 
        success: false, 
        isAdmin: false,
        error: "Member tidak ditemukan" 
      }, { status: 404 });
    }
    
    // Check admin privileges
    const adminPriv = await prisma.user_privileges.findFirst({
      where: { 
        clerk_id: userId,
        privilege: 'admin', 
        is_active: true 
      }
    });
    
    const isAdmin = !!adminPriv;
    
    return NextResponse.json({ 
      success: true,
      isAdmin: isAdmin,
      member: {
        id: member._id,
        name: member.name,
        clerk_id: member.clerk_id
      }
    });
    
  } catch (___error) {
    console.error("Check admin status error:", ___error);
    return NextResponse.json({ 
      success: false, 
      isAdmin: false,
      error: "Server error" 
    }, { status: 500 });
  }
}
