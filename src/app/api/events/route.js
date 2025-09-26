import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { currentUser } from '@clerk/nextjs/server';

// GET /api/events - Retrieve all events
export async function GET(request) {
  try {
    console.log('GET /api/events - Starting...');
    
    // Get current user from Clerk
    const user = await currentUser();
    console.log('GET /api/events - Clerk user:', user?.id);
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized - No user authenticated' }, { status: 401 });
    }

    // Check if user has admin privileges using clerk_id
    const adminPrivilege = await prisma.user_privileges.findFirst({
      where: { 
        clerk_id: user.id, 
        privilege: 'admin', 
        is_active: true 
      }
    });

    console.log('GET /api/events - Admin privilege found:', adminPrivilege ? 'Yes' : 'No');

    if (!adminPrivilege) {
      console.log('GET /api/events - Access denied: Not admin');
      return NextResponse.json({ 
        error: 'Forbidden: Admin access required',
        debug: {
          clerk_id: user.id,
          has_admin_privilege: !!adminPrivilege
        }
      }, { status: 403 });
    }

    // Fetch all events from event_settings table
    const events = await prisma.event_settings.findMany({
      orderBy: { start_date: 'desc' }
    });

    console.log('GET /api/events - Events found:', events.length);

    return NextResponse.json({
      success: true,
      events
    });

  } catch (error) {
    console.error('GET /api/events error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// POST /api/events - Create a new event
export async function POST(request) {
  try {
    console.log('POST /api/events - Starting request');
    
    // Get current user from Clerk
    const user = await currentUser();
    console.log('POST /api/events - Clerk user:', user?.id);
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized - No user authenticated' }, { status: 401 });
    }

    // Check if user has admin privileges using clerk_id
    const adminPrivilege = await prisma.user_privileges.findFirst({
      where: { 
        clerk_id: user.id, 
        privilege: 'admin', 
        is_active: true 
      }
    });

    console.log('POST /api/events - Admin privilege found:', adminPrivilege ? 'Yes' : 'No');

    if (!adminPrivilege) {
      console.log('POST /api/events - Access denied: Not admin');
      return NextResponse.json({ 
        error: 'Forbidden: Admin access required',
        debug: {
          clerk_id: user.id,
          has_admin_privilege: !!adminPrivilege
        }
      }, { status: 403 });
    }

    console.log('POST /api/events - Admin access granted');

    const body = await request.json();
    const { setting_name, setting_value, start_date, end_date } = body;

    // Validation
    if (!setting_name || !setting_value || !start_date || !end_date) {
      return NextResponse.json({ 
        error: 'Missing required fields: setting_name, setting_value, start_date, end_date' 
      }, { status: 400 });
    }

    // Check if event with this name already exists
    const existingEvent = await prisma.event_settings.findUnique({
      where: { setting_name }
    });

    if (existingEvent) {
      return NextResponse.json({ 
        error: 'Event with this name already exists' 
      }, { status: 409 });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    console.log('POST /api/events - Date validation:', {
      start_date_input: start_date,
      end_date_input: end_date,
      startDate_parsed: startDate.toISOString(),
      endDate_parsed: endDate.toISOString(),
      isValidStart: !isNaN(startDate.getTime()),
      isValidEnd: !isNaN(endDate.getTime())
    });

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid date format provided' 
      }, { status: 400 });
    }

    if (startDate >= endDate) {
      return NextResponse.json({ 
        error: 'Start date must be before end date' 
      }, { status: 400 });
    }

    // Create new event
    const newEvent = await prisma.event_settings.create({
      data: {
        setting_name,
        setting_value: String(setting_value),
        start_date: startDate,
        end_date: endDate
      }
    });

    return NextResponse.json({
      success: true,
      event: newEvent,
      message: 'Event created successfully'
    });

  } catch (error) {
    console.error('POST /api/events error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
