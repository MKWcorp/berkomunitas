import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../lib/requireAdmin";
import prisma from "../../../../../../lib/prisma";

export async function POST(request) {
  try {
    // Check admin authorization
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const body = await request.json();
    const { badgeId, memberIds } = body;

    // Validate required fields
    if (!badgeId || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: "badgeId dan memberIds array diperlukan" },
        { status: 400 }
      );
    }

    // Verify badge exists
    const badge = await prisma.badges.findUnique({
      where: { id: badgeId }
    });

    if (!badge) {
      return NextResponse.json(
        { error: "Lencana tidak ditemukan" },
        { status: 404 }
      );
    }

    // Verify all members exist
    const members = await prisma.members.findMany({
      where: { id: { in: memberIds } }
    });

    if (members.length !== memberIds.length) {
      return NextResponse.json(
        { error: "Beberapa member tidak ditemukan" },
        { status: 404 }
      );
    }

    // Get existing member badges to avoid duplicates
    const existingMemberBadges = await prisma.member_badges.findMany({
      where: {
        id_badge: badgeId,
        id_member: { in: memberIds }
      }
    });

    const existingMemberIds = existingMemberBadges.map(mb => mb.id_member);
    const newMemberIds = memberIds.filter(id => !existingMemberIds.includes(id));

    // Create new member badges for members who don't already have this badge
    if (newMemberIds.length > 0) {
      const memberBadgesData = newMemberIds.map(memberId => ({
        id_member: memberId,
        id_badge: badgeId,
        earned_at: new Date()
      }));

      await prisma.member_badges.createMany({
        data: memberBadgesData
      });
    }

    // Return result summary
    return NextResponse.json({
      success: true,
      message: `Berhasil memberikan lencana "${badge.badge_name}"`,
      details: {
        totalRequested: memberIds.length,
        newlyGranted: newMemberIds.length,
        alreadyHave: existingMemberIds.length
      }
    });

  } catch (error) {
    console.error("Error in member badges batch:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memberikan lencana" },
      { status: 500 }
    );
  }
}
