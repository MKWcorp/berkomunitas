import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/requireAdmin";
import prisma from "../../../../../lib/prisma";

export async function GET(request) {
  try {
    // Check admin authorization
    const adminCheck = await requireAdmin(request);
    
    if (!adminCheck.success) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    // Get all member badges with related data
    const memberBadges = await prisma.member_badges.findMany({
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            clerk_id: true,
            nomer_wa: true
          }
        },
        badges: {
          select: {
            id: true,
            badge_name: true,
            description: true,
            criteria_type: true,
            criteria_value: true,
            badge_color: true,
            badge_style: true,
            badge_message: true
          }
        }
      },
      orderBy: [
        { earned_at: 'desc' }
      ]
    });

    return NextResponse.json({
      memberBadges: memberBadges,
      total: memberBadges.length
    });

  } catch (error) {
    console.error("❌ Error fetching member badges:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data member badges" },
      { status: 500 }
    );
  }
}
