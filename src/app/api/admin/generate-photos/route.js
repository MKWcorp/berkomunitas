import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

// Avatar generation logic (moved from script)
const AVATAR_SERVICES = {
  DICEBEAR_AVATAAARS: 'https://api.dicebear.com/7.x/avataaars/svg',
  DICEBEAR_INITIALS: 'https://api.dicebear.com/7.x/initials/svg',
  DICEBEAR_ADVENTURER: 'https://api.dicebear.com/7.x/adventurer/svg',
  DICEBEAR_PERSONAS: 'https://api.dicebear.com/7.x/personas/svg',
  UI_AVATARS: 'https://ui-avatars.com/api'
};

const SELECTED_SERVICE = AVATAR_SERVICES.DICEBEAR_AVATAAARS;

function generateAvatarUrl(member, service = SELECTED_SERVICE) {
  const seed = member.nama_lengkap || member.clerk_id || `user${member.id}`;
  const encodedSeed = encodeURIComponent(seed.toLowerCase().trim());
  
  switch (service) {
    case AVATAR_SERVICES.DICEBEAR_AVATAAARS:
    case AVATAR_SERVICES.DICEBEAR_INITIALS:
    case AVATAR_SERVICES.DICEBEAR_ADVENTURER:
    case AVATAR_SERVICES.DICEBEAR_PERSONAS:
      return `${service}?seed=${encodedSeed}&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    
    case AVATAR_SERVICES.UI_AVATARS:
      const initials = getInitials(member.nama_lengkap || 'User');
      return `${service}/?name=${initials}&size=200&background=random&color=fff&format=png`;
    
    default:
      return `${AVATAR_SERVICES.DICEBEAR_AVATAAARS}?seed=${encodedSeed}&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }
}

function getInitials(name) {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

async function updateMemberPhoto(memberId, photoUrl, source) {
  try {
    await prisma.members.update({
      where: { id: memberId },
      data: { foto_profil_url: photoUrl }
    });
    
    return { success: true, message: `✅ Updated ${memberId}: ${photoUrl} (${source})` };
  } catch (error) {
    return { success: false, message: `❌ Failed to update ${memberId}: ${error.message}` };
  }
}

export async function POST(request) {
  try {
    // Basic auth check (optional - add admin privilege check here)
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      dryRun = false,
      limit = 10, // Default limit untuk safety
      syncFromClerkFirst = true,
      generateForMissingOnly = true
    } = body;

    console.log('🚀 Starting profile photo generation from API...');
    
    // Capture logs
    const logs = [];
    const log = (message) => {
      logs.push(message);
      console.log(message);
    };

    log(`🔧 Sync from Clerk first: ${syncFromClerkFirst}`);
    log(`🎯 Generate for missing only: ${generateForMissingOnly}`);
    log(`🎨 Avatar service: ${SELECTED_SERVICE}`);
    log(`🧪 Dry run: ${dryRun}`);
    log(`📊 Limit: ${limit}`);
    log('');

    // Fetch members
    let whereClause = {};
    if (generateForMissingOnly) {
      whereClause = {
        OR: [
          { foto_profil_url: null },
          { foto_profil_url: '' },
          { foto_profil_url: 'https://via.placeholder.com/150' }
        ]
      };
    }

    const members = await prisma.members.findMany({
      where: whereClause,
      take: limit,
      orderBy: { tanggal_daftar: 'desc' }
    });

    log(`📊 Found ${members.length} members to process`);
    log('');

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const member of members) {
      log(`\n👤 Processing: ${member.nama_lengkap || 'No Name'} (ID: ${member.id})`);
      log(`   Current photo: ${member.foto_profil_url || 'None'}`);

      let newPhotoUrl = null;
      let source = '';

      // For now, skip Clerk sync (can be added later with clerkClient)
      // Step 1: Generate avatar
      newPhotoUrl = generateAvatarUrl(member, SELECTED_SERVICE);
      source = 'Generated';

      // Step 2: Update database
      if (newPhotoUrl && !dryRun) {
        const result = await updateMemberPhoto(member.id, newPhotoUrl, source);
        if (result.success) {
          updated++;
          log(result.message);
        } else {
          errors++;
          log(result.message);
        }
      } else if (newPhotoUrl && dryRun) {
        log(`🧪 [DRY RUN] Would update: ${newPhotoUrl} (${source})`);
        updated++;
      } else {
        log(`⏭️  Skipped: No changes needed`);
        skipped++;
      }
    }

    log('\n📈 SUMMARY');
    log('===========');
    log(`✅ Updated: ${updated}`);
    log(`⏭️  Skipped: ${skipped}`);
    log(`❌ Errors: ${errors}`);
    log(`📊 Total processed: ${members.length}`);

    if (dryRun) {
      log('\n💡 To apply changes, run without dry-run flag');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile photo generation completed',
      stats: { updated, skipped, errors, total: members.length },
      logs: logs
    });

  } catch (error) {
    console.error('Error in generate-photos API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// GET for simple trigger
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get('dryRun') === 'true';
  const limit = searchParams.get('limit') || '10';

  return POST(new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dryRun, limit: parseInt(limit) })
  }));
}
