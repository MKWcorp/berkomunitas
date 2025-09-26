// API Route untuk generate avatar otomatis saat user baru daftar
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { memberId, nama_lengkap } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    // Generate avatar URL menggunakan DiceBear
    const seed = nama_lengkap || `user${memberId}`;
    const encodedSeed = encodeURIComponent(seed.toLowerCase().trim());
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedSeed}&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

    // Update member dengan foto profil yang di-generate
    const updatedMember = await prisma.members.update({
      where: { id: parseInt(memberId) },
      data: { foto_profil_url: avatarUrl }
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar generated successfully',
      avatarUrl: avatarUrl,
      member: updatedMember
    });

  } catch (error) {
    console.error('Error generating avatar:', error);
    return NextResponse.json(
      { error: 'Failed to generate avatar' },
      { status: 500 }
    );
  }
}
