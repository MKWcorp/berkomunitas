import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../lib/requireAdmin";
import prisma from "../../../../../../lib/prisma";

export async function DELETE(_request, { _params }) {
  try {
    // Check admin authorization
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { error: adminCheck._error },
        { status: adminCheck.status }
      );
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const memberId = pathParts[pathParts.length - 2];
    const badgeId = pathParts[pathParts.length - 1];

    // Validate parameters
    if (!memberId || !badgeId) {
      return NextResponse.json(
        { error: "memberId dan badgeId diperlukan dalam URL" },
        { status: 400 }
      );
    }

    // Convert to numbers
    const memberIdNum = parseInt(memberId);
    const badgeIdNum = parseInt(badgeId);

    if (isNaN(memberIdNum) || isNaN(badgeIdNum)) {
      return NextResponse.json(
        { error: "memberId dan badgeId harus berupa angka" },
        { status: 400 }
      );
    }

    // Check if member badge exists
    const memberBadge = await prisma.member_badges.findFirst({
      where: {
        id_member: memberIdNum,
        id_badge: badgeIdNum
      },
      include: {
        badges: true,
        members: true
      }
    });

    if (!memberBadge) {
      return NextResponse.json(
        { error: "Member badge tidak ditemukan" },
        { status: 404 }
      );
    }

    // Delete the member badge
    await prisma.member_badges.deleteMany({
      where: {
        id_member: memberIdNum,
        id_badge: badgeIdNum
      }
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus lencana "${memberBadge.badges.badge_name}" dari ${memberBadge.members.nama_lengkap || memberBadge.members.clerk_id}`
    });

  } catch (___error) {
    console.error("Error deleting member badge:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus lencana member" },
      { status: 500 }
    );
  }
}
