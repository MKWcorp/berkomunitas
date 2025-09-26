import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET(_request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, _error: 'Unauthorized' }, { status: 401 });
    }

    // Find the member based on the clerk_id to get the internal database ID
    let memberData = await prisma.members.findUnique({
      where: { clerk_id: userId },
    });    // If member doesn't exist, create a basic member record (this handles webhook sync issues)
    if (!memberData) {
      console.log('Creating missing member for:', userId);
      
      // Get current user data from Clerk
      const clerkUser = await currentUser();
      
      memberData = await prisma.members.create({
        data: {
          clerk_id: userId,
          nama_lengkap: clerkUser?.fullName || null, // Will be filled by user
          tanggal_daftar: new Date(),
          loyalty_point: 0
        }
      });

      // Create email records if available from Clerk user
      if (clerkUser?.emailAddresses && clerkUser.emailAddresses.length > 0) {
        const primaryEmail = clerkUser.primaryEmailAddress || clerkUser.emailAddresses[0];
        
        const emailData = clerkUser.emailAddresses.map((emailObj) => ({
          clerk_id: userId,
          email: emailObj.emailAddress,
          is_primary: emailObj.id === primaryEmail._id,
          verified: emailObj.verification?.status === 'verified' || false,
        }));

        await prisma.member_emails.createMany({
          data: emailData,
          skipDuplicates: true,
        });
      }

      // Also ensure user privilege exists
      const existingPrivilege = await prisma.user_privileges.findFirst({
        where: { clerk_id: userId }
      });

      if (!existingPrivilege) {
        await prisma.user_privileges.create({
          data: {
            clerk_id: userId,
            privilege: 'user',
            is_active: true,
            granted_at: new Date(),
            granted_by: 'system'
          }
        });
      }
    }

    const memberId = memberData.id;

    // Fetch all other data concurrently with error handling
    const [
      socialProfiles,
      badges,
      notifications,
      pointHistory,
      levels
    ] = await Promise.all([
      prisma.profil_sosial_media.findMany({ where: { id_member: memberId } }).catch(() => []),
      prisma.member_badges.findMany({
        where: { id_member: memberId },
        include: { 
          badges: {
            select: {
              id: true,
              badge_name: true,
              description: true,
              criteria_type: true,
              criteria_value: true,
              badge_color: true,    // Include customization fields
              badge_style: true,    // Include customization fields
              badge_message: true   // Include customization fields
            }
          }
        },
      }).catch(() => []),
      prisma.notifications.findMany({
        where: { id_member: memberId, is_read: false },
        orderBy: { created_at: 'desc' },
        take: 5,
      }).catch(() => []),
      prisma.loyalty_point_history.findMany({
        where: { member_id: memberId },
        orderBy: { created_at: 'desc' },
        take: 10,
      }).catch(() => []),
      prisma.levels.findMany({ orderBy: { level_number: 'asc' } }).catch(() => []),
    ]);

    // Calculate current level and next level info with null safety
    let currentLevel = { level_number: 1, level_name: 'Pemula', required_points: 0 };
    let nextLevel = null;
    
    if (levels && levels.length > 0 && memberData) {
      for (let i = 0; i < levels.length; i++) {
        if (memberData.loyalty_point >= levels[i].required_points) {
          currentLevel = levels[i];
        } else {
          nextLevel = levels[i];
          break;
        }
      }
      // If user is above all levels
      if (!nextLevel && currentLevel) {
        nextLevel = { ...currentLevel, required_points: currentLevel.required_points + 500 };
      }
    }
    
    const pointsToNextLevel = nextLevel ? Math.max(0, nextLevel.required_points - (memberData?.loyalty_point || 0)) : 0;    const progressPercent = nextLevel && currentLevel
      ? Math.min(100, Math.round(((memberData.loyalty_point - currentLevel.required_points) / (nextLevel.required_points - currentLevel.required_points)) * 100))
      : 100;

    // Auto-generate profile photo if missing for existing members
    if (memberData && (!memberData.foto_profil_url || memberData.foto_profil_url === 'https://via.placeholder.com/150' || memberData.foto_profil_url === '')) {
      try {
        const seed = memberData.nama_lengkap || `user${memberData.id}`;
        const encodedSeed = encodeURIComponent(seed.toLowerCase().trim());
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedSeed}&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
        
        await prisma.members.update({
          where: { id: memberData.id },
          data: { foto_profil_url: avatarUrl }
        });
        
        // Update memberData with new avatar URL
        memberData.foto_profil_url = avatarUrl;
        console.log(`🎨 Auto-generated avatar for existing member ${memberData.nama_lengkap}: ${avatarUrl}`);
      } catch (_generateError) {
        console.error('Error auto-generating avatar:', generateError);
        // Continue without throwing error
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        member: memberData,
        socialProfiles: socialProfiles || [],
        badges: (badges || []).map(b => ({
          id: b.id,
          badge_name: b.badges?.badge_name || 'Unknown Badge',
          description: b.badges?.description || '',
          earned_at: b.earned_at,
          earned_date: b.earned_at, // For backward compatibility
          badge_color: b.badges?.badge_color || 'blue',    // Include customization
          badge_style: b.badges?.badge_style || 'flat',    // Include customization  
          badge_message: b.badges?.badge_message || 'Achievement' // Include customization
        })),
        notifications: notifications || [],
        pointHistory: pointHistory || [],
        level: {
          current: currentLevel,
          next: nextLevel,
          pointsToNextLevel,
          progressPercent,
        },
      },
    });
  } catch (__error) {
    console.error('Error fetching profile dashboard:', __error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
