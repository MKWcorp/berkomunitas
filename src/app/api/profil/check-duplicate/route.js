import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
// Helper function to mask email
function maskEmail(email) {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 4) {
    return `****@${domain}`;
  }
  return `${localPart.slice(0, -4)}****@${domain}`;
}

// Helper function to extract platform and username from social media link
function parseSocialMediaLink(link) {
  if (!link || typeof link !== 'string') return null;
  
  const url = link.trim();
    // Instagram
  if (url.includes('instagram.com')) {
    const match = url.match(/instagram\.com\/([^\/\s?]+)/);
    if (match) {
      return {
        platform: 'Instagram',
        username: match[1].replace('@', '')
      };
    }
  }
    // TikTok
  if (url.includes('tiktok.com')) {
    const match = url.match(/tiktok\.com\/@?([^\/\s?]+)/);
    if (match) {
      return {
        platform: 'TikTok',
        username: match[1].replace('@', '')
      };
    }
  }
  
  // Facebook
  if (url.includes('facebook.com') || url.includes('fb.com')) {
    const match = url.match(/(?:facebook|fb)\.com\/([^\/\s?]+)/);
    if (match) {
      return {
        platform: 'Facebook',
        username: match[1]
      };
    }
  }
    // Twitter/X
  if (url.includes('twitter.com') || url.includes('x.com')) {
    const match = url.match(/(?:twitter|x)\.com\/([^\/\s?]+)/);
    if (match) {
      return {
        platform: 'Twitter',
        username: match[1].replace('@', '')
      };
    }
  }
  
  // YouTube
  if (url.includes('youtube.com')) {
    const match = url.match(/youtube\.com\/(?:c\/|channel\/|user\/|@)?([^\/\s?]+)/);
    if (match) {
      return {
        platform: 'YouTube',
        username: match[1].replace('@', '')
      };
    }
  }
  
  return null;
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const { nomer_wa, social_media_links = [] } = body;

    console.log('🔍 Checking duplicates for:', { nomer_wa, social_media_links });

    const duplicates = [];

    // Check WhatsApp number duplication
    if (nomer_wa) {      const existingWA = await prisma.members.findFirst({
        where: {
          nomer_wa: nomer_wa,
          NOT: {
            OR: [
              { email: user.email },
              { google_id: user.google_id },
              user.clerk_id ? { google_id: user.clerk_id } : { id: user.id }
            ].filter(Boolean)
          }
        },
        include: {
          member_emails: {
            where: { is_primary: true }
          }
        }
      });

      if (existingWA) {
        const primaryEmail = existingWA.member_emails[0]?.email;
        duplicates.push({
          type: 'whatsapp',
          data: nomer_wa,
          existing_user: {
            google_id: existingWA.clerk_id,
            nama_lengkap: existingWA.nama_lengkap,
            masked_email: maskEmail(primaryEmail)
          }
        });
      }
    }

    // Check social media duplication
    if (social_media_links.length > 0) {
      for (const link of social_media_links) {
        const parsed = parseSocialMediaLink(link);
        if (parsed) {          const existingSocial = await prisma.profil_sosial_media.findFirst({
            where: {
              platform: parsed.platform,
              username_sosmed: parsed.username,
              member: {
                NOT: {
                  OR: [
                    { email: user.email },
                    { google_id: user.google_id },
                    user.clerk_id ? { google_id: user.clerk_id } : { id: user.id }
                  ].filter(Boolean)
                }
              }
            },
            include: {
              member: {
                include: {
                  member_emails: {
                    where: { is_primary: true }
                  }
                }
              }
            }
          });

          if (existingSocial) {
            const primaryEmail = existingSocial.member.member_emails[0]?.email;
            duplicates.push({
              type: 'social_media',
              platform: parsed.platform,
              username: parsed.username,
              data: link,
              existing_user: {
                google_id: existingSocial.member.clerk_id,
                nama_lengkap: existingSocial.member.nama_lengkap,
                masked_email: maskEmail(primaryEmail)
              }
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      has_duplicates: duplicates.length > 0,
      duplicates: duplicates
    });

  } catch (error) {
    console.error('❌ Check duplicate error:', error);
    return NextResponse.json({ 
      error: 'Gagal mengecek duplikasi: ' + error.message 
    }, { status: 500 });
  }
}
