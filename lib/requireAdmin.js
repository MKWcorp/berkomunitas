import { auth } from '@clerk/nextjs/server';
import prisma from './prisma';

export async function requireAdmin(_request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { 
        success: false, 
        error: "Tidak terautentikasi", 
        status: 401 
      };
    }
    
    const member = await prisma.members.findUnique({ 
      where: { clerk_id: userId } 
    });
    if (!member) {
      return { 
        success: false, 
        error: "Member tidak ditemukan", 
        status: 404 
      };
    }
    
    const priv = await prisma.user_privileges.findFirst({
      where: { 
        clerk_id: userId,
        privilege: 'admin', 
        is_active: true 
      }
    });
    
    if (!priv) {
      return { 
        success: false, 
        error: "Akses ditolak - bukan admin", 
        status: 403 
      };
    }
    
    return { 
      success: true, 
      member: member 
    };
    
  } catch (error) {
    console.error("Admin auth error:", error);
    return { 
      success: false, 
      error: "Internal server error", 
      status: 500 
    };
  }
}
