import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        isAdmin: false,
        _error: "Tidak terautentikasi" 
      }, { status: 401 });
    }
    
    // Check if member exists
    const member = await prisma.members.findUnique({ 
      where: { id: user.id }
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
      where: { member_id: user.id,
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
        google_id: member.clerk_id
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
