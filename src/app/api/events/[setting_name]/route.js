import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { currentUser } from '@clerk/nextjs/server';

// PUT /api/events/[setting_name] - Update an existing event
export async function PUT(request, { params }) {
  try {
    // Get current user from Clerk
    const user = await currentUser();
    console.log('PUT /api/events/[setting_name] - Clerk user:', user?.id);
    
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

    console.log('PUT /api/events/[setting_name] - Admin privilege found:', adminPrivilege ? 'Yes' : 'No');

    if (!adminPrivilege) {
      console.log('PUT /api/events/[setting_name] - Access denied: Not admin');
      return NextResponse.json({ 
        error: 'Forbidden: Admin access required',
        debug: {
          clerk_id: user.id,
          has_admin_privilege: !!adminPrivilege
        }
      }, { status: 403 });
    }

    const resolvedParams = await params;
    const { setting_name } = resolvedParams;
    const body = await request.json();
    const { setting_name: new_setting_name, setting_value, description, start_date, end_date } = body;

    // Validation
    if (!new_setting_name || !setting_value || !start_date || !end_date) {
      return NextResponse.json({ 
        error: 'Missing required fields: setting_name, setting_value, start_date, end_date' 
      }, { status: 400 });
    }

    // Check if event exists
    const existingEvent = await prisma.event_settings.findUnique({
      where: { setting_name }
    });

    if (!existingEvent) {
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    console.log('PUT /api/events/[setting_name] - Date validation:', {
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

    // Check if setting_name is being changed
    const isSettingNameChanged = setting_name !== new_setting_name;
    
    let updatedEvent;
    
    if (isSettingNameChanged) {
      // If setting_name changes, we need to create new record and delete old one
      // because setting_name is the PRIMARY KEY
      
      console.log(`Setting name changed: ${setting_name} → ${new_setting_name}`);
      
      // Check if new setting_name already exists
      const conflictEvent = await prisma.event_settings.findUnique({
        where: { setting_name: new_setting_name }
      });
      
      if (conflictEvent) {
        return NextResponse.json({ 
          error: `Event with name '${new_setting_name}' already exists` 
        }, { status: 409 });
      }
      
      // Create new event with new setting_name
      updatedEvent = await prisma.event_settings.create({
        data: {
          setting_name: new_setting_name,
          setting_value: String(setting_value),
          description: description || '',
          start_date: startDate,
          end_date: endDate
        }
      });
      
      // Delete old event
      await prisma.event_settings.delete({
        where: { setting_name }
      });
      
      console.log(`Event recreated: ${setting_name} → ${new_setting_name}`);
      
    } else {
      // Normal update if setting_name doesn't change
      updatedEvent = await prisma.event_settings.update({
        where: { setting_name },
        data: {
          setting_value: String(setting_value),
          description: description || '',
          start_date: startDate,
          end_date: endDate
        }
      });
    }

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: isSettingNameChanged ? 
        `Event renamed from '${setting_name}' to '${new_setting_name}' successfully` :
        'Event updated successfully',
      setting_name_changed: isSettingNameChanged,
      old_setting_name: isSettingNameChanged ? setting_name : undefined,
      new_setting_name: updatedEvent.setting_name
    });

  } catch (error) {
    console.error('PUT /api/events/[setting_name] error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE /api/events/[setting_name] - Delete an event
export async function DELETE(request, { params }) {
  try {
    // Get current user from Clerk
    const user = await currentUser();
    console.log('DELETE /api/events/[setting_name] - Clerk user:', user?.id);
    
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

    console.log('DELETE /api/events/[setting_name] - Admin privilege found:', adminPrivilege ? 'Yes' : 'No');

    if (!adminPrivilege) {
      console.log('DELETE /api/events/[setting_name] - Access denied: Not admin');
      return NextResponse.json({ 
        error: 'Forbidden: Admin access required',
        debug: {
          clerk_id: user.id,
          has_admin_privilege: !!adminPrivilege
        }
      }, { status: 403 });
    }

    const resolvedParams = await params;
    const { setting_name } = resolvedParams;

    // Check if event exists
    const existingEvent = await prisma.event_settings.findUnique({
      where: { setting_name }
    });

    if (!existingEvent) {
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Delete the event
    await prisma.event_settings.delete({
      where: { setting_name }
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('DELETE /api/events/[setting_name] error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
