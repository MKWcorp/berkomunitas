import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user is admin
    // TODO: Get actual member growth data from database
    
    // Mock member growth data
    const memberGrowth = [
      { label: 'Jan', value: 45 },
      { label: 'Feb', value: 67 },
      { label: 'Mar', value: 89 },
      { label: 'Apr', value: 123 },
      { label: 'May', value: 156 }
    ];

    return NextResponse.json(memberGrowth);

  } catch (error) {
    console.error('Member Stats API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
