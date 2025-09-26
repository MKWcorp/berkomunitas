import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(_request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ success: false, privileges: [] }, { status: 401 });
  }

  try {
    // Cari semua hak akses aktif untuk user clerk_id di database
    const userPrivileges = await prisma.user_privileges.findMany({
      where: {
        clerk_id: userId, // Gunakan clerk_id sesuai schema yang baru
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