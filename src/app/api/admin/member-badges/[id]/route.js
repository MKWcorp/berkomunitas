import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { requireAdmin } from '../../../../../../lib/requireAdmin';

export async function DELETE(request, { params }) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.success) {
    return NextResponse.json(
      { error: authCheck.error || 'Forbidden' },
      { status: authCheck.status || 403 }
    );
  }
  
  const { id } = await params;
  
  try {
    await prisma.member_badges.delete({
      where: { id: Number(id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting member badge:', error);
    return NextResponse.json({ error: 'Failed to remove badge' }, { status: 500 });
  }
}
