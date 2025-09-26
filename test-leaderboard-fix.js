// Test leaderboard API after fixing user_usernames relations
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testLeaderboardAPI() {
  try {
    console.log('🧪 Testing leaderboard API after user_usernames fixes...')
    
    // Test the same query that was failing
    const loyaltyRaw = await prisma.peringkat_member_loyalty.findMany({
      take: 10,
      orderBy: { peringkat: 'asc' }
    })
    
    console.log(`📊 Found ${loyaltyRaw.length} loyalty rankings`)
    
    if (loyaltyRaw.length > 0) {
      const loyaltyMemberIds = loyaltyRaw.map(x => x.id_member).filter(Boolean)
      console.log(`👥 Testing member query for ${loyaltyMemberIds.length} members...`)
      
      // This is the query that was failing
      const loyaltyProfiles = await prisma.members.findMany({
        where: {
          id: { in: loyaltyMemberIds.slice(0, 5) } // Test first 5
        },
        include: {
          user_usernames_relation: true
        }
      })
      
      console.log('✅ Member query successful!')
      console.log(`📝 Retrieved ${loyaltyProfiles.length} member profiles`)
      
      // Test data access
      loyaltyProfiles.forEach((profile, index) => {
        const usernameObj = profile?.user_usernames_relation?.[0] || null
        console.log(`   ${index + 1}. ${profile.nama_lengkap} - Username: ${usernameObj?.username || 'No username'}`)
      })
      
    } else {
      console.log('⚠️ No loyalty rankings found')
    }
    
    console.log('\n🚀 Leaderboard API test completed successfully!')
    
  } catch (error) {
    console.error('❌ Leaderboard API test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLeaderboardAPI()
