import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '../../../../lib/prisma';

// Helper function to parse social media links
function parseSocialMediaLink(link) {
  if (!link || typeof link !== 'string') return null;
  
  const url = link.trim();
    // Instagram
  if (url.includes('instagram.com')) {
    const match = url.match(/instagram\.com\/([^\/\s?]+)/);
    if (match) {
      return {
        platform: 'Instagram',
        username_sosmed: match[1].replace('@', ''),
        profile_link: url
      };
    }
  }
    // TikTok
  if (url.includes('tiktok.com')) {
    const match = url.match(/tiktok\.com\/@?([^\/\s?]+)/);
    if (match) {
      return {
        platform: 'TikTok',
        username_sosmed: match[1].replace('@', ''),
        profile_link: url
      };
    }
  }
  
  // Facebook
  if (url.includes('facebook.com') || url.includes('fb.com')) {
    const match = url.match(/(?:facebook|fb)\.com\/([^\/\s?]+)/);
    if (match) {
      return {
        platform: 'Facebook',
        username_sosmed: match[1],
        profile_link: url
      };
    }
  }
    // Twitter/X
  if (url.includes('twitter.com') || url.includes('x.com')) {
    const match = url.match(/(?:twitter|x)\.com\/([^\/\s?]+)/);
    if (match) {
      return {
        platform: 'Twitter',
        username_sosmed: match[1].replace('@', ''),
        profile_link: url
      };
    }
  }
  
  // YouTube
  if (url.includes('youtube.com')) {
    const match = url.match(/youtube\.com\/(?:c\/|channel\/|user\/|@)?([^\/\s?]+)/);
    if (match) {
      return {
        platform: 'YouTube',
        username_sosmed: match[1].replace('@', ''),
        profile_link: url
      };
    }
  }
  
  return null;
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;    // Get member data with emails and privileges
    const member = await prisma.members.findUnique({
      where: { clerk_id: userId },
      include: {
        member_emails: {
          orderBy: [
            { is_primary: 'desc' },
            { verified: 'desc' }
          ]
        },
        profil_sosial_media: true,
        loyalty_point_history: {
          orderBy: {
            created_at: 'desc'
          }
        },
        user_privileges: {
          where: {
            is_active: true
          },
          orderBy: {
            granted_at: 'desc'
          }
        }
      }
    });

    if (!member) {
      return NextResponse.json({ 
        success: false,
        data: null,
        message: 'Member not found'
      });
    }

    // Get member badges
    const memberBadges = await prisma.member_badges.findMany({
      where: { id_member: member.id },
      include: {
        badges: true
      },
      orderBy: { earned_at: 'desc' }
    });

    // Get member level
    const levels = await prisma.levels.findMany({
      orderBy: { required_points: 'asc' }
    });
    
    const currentLevel = levels.reduce((acc, level) => {
      return member.loyalty_point >= level.required_points ? level : acc;
    }, levels[0] || { level_number: 1, level_name: 'Pemula', required_points: 0 });
    
    const nextLevel = levels.find(level => level.required_points > member.loyalty_point);
    const pointsToNextLevel = nextLevel ? nextLevel.required_points - member.loyalty_point : 0;
    const progressPercent = nextLevel 
      ? ((member.loyalty_point - currentLevel.required_points) / 
         (nextLevel.required_points - currentLevel.required_points)) * 100
      : 100;

    return NextResponse.json({
      success: true,
      data: {
        member: member,
        socialProfiles: member.profil_sosial_media || [],
        badges: (memberBadges || []).map(b => ({
          badge_name: b.badges?.badge_name || 'Unknown Badge',
          description: b.badges?.description || '',
          earned_at: b.earned_at,
        })),
        level: {
          current: currentLevel,
          next: nextLevel,
          pointsToNextLevel,
          progressPercent,
        },
        privileges: member.user_privileges || []
      },
    });

  } catch (error) {
    console.error('GET /api/profil error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const { action, link } = body;

    if (action === 'add_social_link') {
      if (!link) {
        return NextResponse.json({ success: false, error: 'Link sosial media harus diisi.' }, { status: 400 });
      }

      const parsed = parseSocialMediaLink(link);
      if (!parsed) {
        return NextResponse.json({ success: false, error: 'Link sosial media tidak valid atau tidak didukung.' }, { status: 400 });
      }

      const { platform, username_sosmed, profile_link } = parsed;
      
      // --- START: SOCIAL MEDIA DUPLICATE CHECK ---
      if (platform && username_sosmed) {
        const existingSocial = await prisma.profil_sosial_media.findFirst({
          where: {
            platform: platform,
            username_sosmed: {
              equals: username_sosmed,
              mode: 'insensitive'
            },
            members: {
              clerk_id: {
                not: userId
              }
            }
          },
          include: {
            members: {
              include: {
                member_emails: {
                  where: { is_primary: true },
                  select: { email: true }
                }
              }
            }
          }
        });

        if (existingSocial) {
          const ownerEmail = existingSocial.members.member_emails[0]?.email || 'email tidak tersedia';
          const maskedEmail = ownerEmail.length > 4 ? 
            '****' + ownerEmail.substring(4) : 
            '****' + ownerEmail.substring(1);
          
          return NextResponse.json({
            success: false,
            error: `Akun ${platform} @${username_sosmed} sudah dipakai oleh ${maskedEmail}. Harap gunakan email lain.`,
            duplicate: true,
            field: 'social_link'
          }, { status: 409 });
        }
      }
      // --- END: SOCIAL MEDIA DUPLICATE CHECK ---

      // Ensure member exists (upsert approach)
      const member = await prisma.members.upsert({
        where: { clerk_id: userId },
        update: {}, // No update needed, just ensure it exists
        create: {
          clerk_id: userId,
          nama_lengkap: 'User', // Default name, will be updated later
          tanggal_daftar: new Date(),
          loyalty_point: 0
        }
      });

      console.log('Member ensured for social media:', member.id);

      // Ensure user privilege exists
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
        console.log('User privilege created for:', userId);
      }

      const newSocialProfile = await prisma.profil_sosial_media.create({
        data: {
          id_member: member.id,
          platform,
          username_sosmed,
          profile_link,
        },
      });

      return NextResponse.json({ success: true, data: newSocialProfile });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak valid.' }, { status: 400 });

  } catch (error) {
    console.error('POST /api/profil error:', error);
    return NextResponse.json({ 
      error: 'Gagal memproses permintaan: ' + error.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const { nama_lengkap, nomer_wa, bio, status_kustom } = body;

    console.log('PUT request received:', { nama_lengkap, nomer_wa, bio, status_kustom });

    // Validate input
    if (!nama_lengkap || !nomer_wa) {
      return NextResponse.json({ 
        success: false,
        error: 'Nama lengkap dan Nomor WA harus diisi' 
      }, { status: 400 });
    }

    // Validate status_kustom length
    if (status_kustom && status_kustom.length > 100) {
      return NextResponse.json({ 
        success: false,
        error: 'Status kustom maksimal 100 karakter' 
      }, { status: 400 });
    }

    // --- START: DUPLICATE CHECK ---
    if (nomer_wa) {
      const existingByWA = await prisma.members.findFirst({
        where: {
          nomer_wa: nomer_wa,
          clerk_id: {
            not: userId
          }
        },
        include: {
          member_emails: {
            where: { is_primary: true },
            select: { email: true }
          }
        }
      });

      if (existingByWA) {
        const ownerEmail = existingByWA.member_emails[0]?.email || 'email tidak tersedia';
        const maskedEmail = ownerEmail.length > 4 ? 
          '****' + ownerEmail.substring(4) : 
          '****' + ownerEmail.substring(1);
        
        return NextResponse.json({
          success: false,
          error: `Nomor WhatsApp ini sudah dipakai oleh ${maskedEmail}. Harap gunakan email lain.`,
          duplicate: true,
          field: 'nomer_wa'
        }, { status: 409 }); // 409 Conflict
      }
    }
    // --- END: DUPLICATE CHECK ---

    // Upsert member data (create if not exists, update if exists)
    const updatedMember = await prisma.members.upsert({
      where: { clerk_id: userId },
      update: {
        nama_lengkap: nama_lengkap,
        nomer_wa: nomer_wa,
        bio: bio || null,
        status_kustom: status_kustom || null
      },
      create: {
        clerk_id: userId,
        nama_lengkap: nama_lengkap,
        nomer_wa: nomer_wa,
        bio: bio || null,
        status_kustom: status_kustom || null,
        tanggal_daftar: new Date(),
        loyalty_point: 0
      }
    });

    console.log('Member upserted successfully:', updatedMember);    // Auto-sync display_name in user_usernames table with nama_lengkap
    try {
      await prisma.user_usernames.updateMany({
        where: { member_id: updatedMember.id },
        data: { display_name: updatedMember.nama_lengkap }
      });
      console.log('Display name synced with nama_lengkap for member:', updatedMember.id);
    } catch (syncError) {
      console.log('No username record to sync for member:', updatedMember.id);
    }

    // Auto-generate profile photo if missing
    if (!updatedMember.foto_profil_url || updatedMember.foto_profil_url === 'https://via.placeholder.com/150' || updatedMember.foto_profil_url === '') {
      try {
        const seed = updatedMember.nama_lengkap || `user${updatedMember.id}`;
        const encodedSeed = encodeURIComponent(seed.toLowerCase().trim());
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedSeed}&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
        
        await prisma.members.update({
          where: { id: updatedMember.id },
          data: { foto_profil_url: avatarUrl }
        });
        
        // Update the returned member data
        updatedMember.foto_profil_url = avatarUrl;
        console.log(`🎨 Auto-generated avatar for member ${updatedMember.nama_lengkap}: ${avatarUrl}`);
      } catch (generateError) {
        console.error('Error auto-generating avatar:', generateError);
        // Continue without throwing error
      }
    }

    // Check for profile completeness and award points
    const socialProfiles = await prisma.profil_sosial_media.count({
      where: { id_member: updatedMember.id }
    });

    if (updatedMember.nama_lengkap && updatedMember.nomer_wa && socialProfiles > 0) {
      const existingBonus = await prisma.loyalty_point_history.findFirst({
        where: {
          member_id: updatedMember.id,
          event: 'Lengkapi Profil'
        }
      });

      if (!existingBonus) {
        await prisma.$transaction([
          prisma.members.update({
            where: { id: updatedMember.id },
            data: { loyalty_point: { increment: 5 } }
          }),
          prisma.loyalty_point_history.create({
            data: {
              member_id: updatedMember.id,
              point: 5,
              event: 'Lengkapi Profil'
            }
          })
        ]);
        console.log('Profile completion bonus awarded:', updatedMember.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: updatedMember
    });

  } catch (error) {
    console.error('PUT /api/profil error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Gagal memperbarui profil: ' + error.message 
    }, { status: 500 });
  }
}

// PATCH method for updating bio and status_kustom only
export async function PATCH(request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const { bio, status_kustom } = await request.json();

    // Update only bio and status_kustom
    const updatedMember = await prisma.members.update({
      where: { clerk_id: userId },
      data: {
        bio: bio || null,
        status_kustom: status_kustom || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Bio dan status kustom berhasil diperbarui',
      data: updatedMember
    });

  } catch (error) {
    console.error('PATCH /api/profil error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Gagal memperbarui bio dan status kustom: ' + error.message 
    }, { status: 500 });
  }
}
