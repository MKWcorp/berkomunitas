import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '../../../../../../lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/profil/sosial-media/[id]
 * Delete social media profile by ID
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid profile ID is required' }, 
        { status: 400 }
      );
    }

    const userId = user.id;
    const profileId = parseInt(id);

    // Retry logic for database operations
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

    // Find member by clerk_id with retry
    const member = await retryOperation(async () => {
      return await prisma.members.findFirst({
        where: { id: user.id }
      });
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Verify ownership and delete with retry
    const deleted = await retryOperation(async () => {
      return await prisma.profil_sosial_media.deleteMany({
        where: { 
          id: profileId,
          id_member: member.id 
        }
      });
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Profile not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Profil sosial media berhasil dihapus' });

  } catch (error) {
    console.error('Error deleting social media profile:', error);
    
    // Handle specific database connection errors
    if (error.code === 'UND_ERR_SOCKET') {
      return NextResponse.json(
        { error: 'Database connection error. Please try again in a moment.' }, 
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
