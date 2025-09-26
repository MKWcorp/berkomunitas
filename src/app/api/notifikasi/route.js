import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '../../../utils/prisma';

// GET - Fetch user notifications
export async function GET(request) {
  const retryOperation = async (operation, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.error(`Database operation attempt ${attempt} failed:`, error);
        
        // If it's a connection error and we have retries left
        if (error.code === 'UND_ERR_SOCKET' && attempt < maxRetries) {
          console.log(`Retrying database operation (attempt ${attempt + 1}/${maxRetries})...`);
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw error;
      }
    }
  };

  try {
    // Check if user is authenticated
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to view notifications.' },
        { status: 401 }
      );
    }

    // Get the logged-in member's data
    const currentMember = await prisma.members.findUnique({
      where: {
        clerk_id: user.id
      }
    });

    if (!currentMember) {
      return NextResponse.json(
        { error: 'Member profile not found.' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const unreadOnly = searchParams.get('unread_only') === 'true';

    // Build where clause
    const whereClause = {
      id_member: currentMember.id
    };

    if (unreadOnly) {
      whereClause.is_read = false;
    }

    // Fetch notifications with retry
    const notifications = await retryOperation(async () => {
      return await prisma.notifications.findMany({
        where: whereClause,
        orderBy: {
          created_at: 'desc'
        },
        take: limit,
        skip: offset
      });
    });

    // Get unread count with retry
    const unreadCount = await retryOperation(async () => {
      return await prisma.notifications.count({
        where: {
          id_member: currentMember.id,
          is_read: false
        }
      });
    });

    // Get total count with retry
    const totalCount = await retryOperation(async () => {
      return await prisma.notifications.count({
        where: {
          id_member: currentMember.id
        }
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total: totalCount,
          unread_count: unreadCount,
          limit,
          offset,
          has_more: offset + limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    // Handle specific database connection errors
    if (error.code === 'UND_ERR_SOCKET') {
      return NextResponse.json(
        { error: 'Database connection error. Please refresh the page.' },
        { status: 503 } // Service Unavailable
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - Mark notifications as read
export async function POST(request) {
  try {
    // Check if user is authenticated
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Get the logged-in member's data
    const currentMember = await prisma.members.findUnique({
      where: {
        clerk_id: user.id
      }
    });

    if (!currentMember) {
      return NextResponse.json(
        { error: 'Member profile not found.' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { notification_ids, mark_all_read } = body;

    if (mark_all_read) {
      // Mark all notifications as read
      const updateResult = await prisma.notifications.updateMany({
        where: {
          id_member: currentMember.id,
          is_read: false
        },
        data: {
          is_read: true
        }
      });

      return NextResponse.json({
        success: true,
        message: `${updateResult.count} notifications marked as read`,
        data: {
          updated_count: updateResult.count
        }
      });
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      const updateResult = await prisma.notifications.updateMany({
        where: {
          id: {
            in: notification_ids
          },
          id_member: currentMember.id
        },
        data: {
          is_read: true
        }
      });

      return NextResponse.json({
        success: true,
        message: `${updateResult.count} notifications marked as read`,
        data: {
          updated_count: updateResult.count
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Either notification_ids array or mark_all_read flag is required' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete notifications
export async function DELETE(request) {
  try {
    // Check if user is authenticated
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Get the logged-in member's data
    const currentMember = await prisma.members.findUnique({
      where: {
        clerk_id: user.id
      }
    });

    if (!currentMember) {
      return NextResponse.json(
        { error: 'Member profile not found.' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const notificationIds = searchParams.get('ids')?.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      // Delete all notifications for user
      const deleteResult = await prisma.notifications.deleteMany({
        where: {
          id_member: currentMember.id
        }
      });

      return NextResponse.json({
        success: true,
        message: `${deleteResult.count} notifications deleted`,
        data: {
          deleted_count: deleteResult.count
        }
      });
    } else if (notificationIds && notificationIds.length > 0) {
      // Delete specific notifications
      const deleteResult = await prisma.notifications.deleteMany({
        where: {
          id: {
            in: notificationIds
          },
          id_member: currentMember.id
        }
      });

      return NextResponse.json({
        success: true,
        message: `${deleteResult.count} notifications deleted`,
        data: {
          deleted_count: deleteResult.count
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Either notification IDs or delete all flag is required' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
