import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';
export async function GET(request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return NextResponse.json({ success: false, privileges: [] }, { status: 401 });
  }

  try {
    // Cari semua hak akses aktif untuk user clerk_id di database
    const userPrivileges = await prisma.user_privileges.findMany({
      where: { id: user.id, // Gunakan clerk_id sesuai schema yang baru
        is_active: true,
      },
      select: {
        privilege: true,
      },
    });

    const privilegeList = userPrivileges.map(p => p.privilege);
    return NextResponse.json({ success: true, privileges: privilegeList });

  } catch (____error) {
    console.error("Error fetching user privileges:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch privileges' }, { status: 500 });
  }
}