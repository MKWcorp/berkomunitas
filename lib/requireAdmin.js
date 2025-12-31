import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from './prisma';

export async function requireAdmin(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return { 
        success: false, 
        error: "Tidak terautentikasi", 
        status: 401 
      };
    }
    
    const member = await prisma.members.findUnique({ 
      where: { id: user.id } 
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
        member_id: user.id,
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
