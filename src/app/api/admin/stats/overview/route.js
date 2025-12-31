import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
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
