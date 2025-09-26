import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

/**
 * GET /api/events/public
 * Get active events untuk public display (tanpa perlu admin auth)
 */
export async function GET() {
  try {
    // Get current date for filtering active events
    const now = new Date();
    
    // Fetch events yang sedang dalam periode aktif
    const allEvents = await prisma.event_settings.findMany({
      where: {
        start_date: {
          lte: now
        },
        end_date: {
          gte: now
        }
      },
      orderBy: { start_date: 'desc' }
    });

    // Filter events yang auto-active berdasarkan setting_value
    const activeEvents = allEvents.filter(event => {
      const settingValue = event.setting_value;
      
      // Auto-activation logic:
      // 1. Boolean activation: "true" atau "active"
      const isBooleanActive = settingValue === 'true' || settingValue === 'active';
      
      // 2. Numeric boost: angka > 0 = auto-active dengan boost percentage
      const isNumericBoost = !isNaN(parseFloat(settingValue)) && parseFloat(settingValue) > 0;
      
      return isBooleanActive || isNumericBoost;
    });

    console.log('GET /api/events/public - Active events found:', activeEvents.length);

    return NextResponse.json({
      success: true,
      events: activeEvents,
      total: activeEvents.length
    });

  } catch (error) {
    console.error('GET /api/events/public error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
