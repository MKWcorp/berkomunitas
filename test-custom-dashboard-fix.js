// Test custom dashboard DRW Corp API after fixes
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testCustomDashboard() {
  try {
    console.log('🧪 Testing custom dashboard DRW Corp API...')
    
    // Test the query from custom dashboard API
    const allMembers = await prisma.members.findMany({
      include: {
        profil_sosial_media: {
          select: {
            username_sosmed: true,
            platform: true
          }
        },
        member_badges: {
          include: {
            badges: {
              select: {
                badge_name: true
              }
            }
          }
        },
        user_usernames_relation: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        loyalty_point: 'desc'
      },
      take: 5 // Just first 5 for testing
    })
    
    console.log(`✅ Query successful! Retrieved ${allMembers.length} members`)
    
    // Test data formatting like in the API
    const formattedMembers = allMembers.map((member) => {
      const socialProfiles = member.profil_sosial_media || []
      
      // Test the username access that was failing
      const primarySocialMedia = socialProfiles.length > 0 
        ? socialProfiles[0].username_sosmed 
        : member.user_usernames_relation?.[0]?.username || `member_${member.id}`

      // Check DRW Corp badge
      const hasDrwCorpBadge = member.member_badges.some(
        mb => mb.badges.badge_name === 'DRW Corp'
      )
      
      const badges = member.member_badges.map(mb => mb.badges.badge_name)
      
      return {
        nama_lengkap: member.nama_lengkap || 'Nama tidak tersedia',
        username_sosmed: primarySocialMedia,
        username: member.user_usernames_relation?.[0]?.username || null,
        loyalty_point: member.loyalty_point || 0,
        badges: badges,
        hasDrwCorpBadge: hasDrwCorpBadge
      }
    })
    
    console.log('\n📊 Formatted member data:')
    formattedMembers.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.nama_lengkap} (${member.username})`)
      console.log(`      Loyalty: ${member.loyalty_point}, DRW Corp: ${member.hasDrwCorpBadge}`)
      console.log(`      Badges: ${member.badges.join(', ') || 'None'}`)
    })
    
    console.log('\n🚀 Custom dashboard API test completed successfully!')
    
  } catch (error) {
    console.error('❌ Custom dashboard API test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCustomDashboard()
