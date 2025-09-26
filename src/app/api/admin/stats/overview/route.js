import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user is admin
    // TODO: Get actual stats from database
    
    // Mock overview stats for now
    const stats = {
      totalMembers: 1247,
      totalComments: 8920,
      totalBadges: 156,
      activeToday: 89
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Overview Stats API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
