// Verify badge columns in production database
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyBadgeColumns() {
  try {
    console.log('🔍 Verifying badge columns in production database...')
    
    // Check if we can access badges with new columns
    const badgeCount = await prisma.badges.count()
    console.log(`📊 Total badges in database: ${badgeCount}`)
    
    // Get a sample badge to verify columns exist
    const sampleBadge = await prisma.badges.findFirst({
      select: {
        id: true,
        badge_name: true,
        description: true,
        badge_color: true,
        badge_style: true,
        badge_message: true
      }
    })
    
    if (sampleBadge) {
      console.log('✅ Sample badge with new columns:')
      console.log(JSON.stringify(sampleBadge, null, 2))
    } else {
      console.log('ℹ️ No badges found in database')
    }
    
    // Check member badges
    const memberBadgeCount = await prisma.member_badges.count()
    console.log(`👥 Total member badges: ${memberBadgeCount}`)
    
    console.log('\n✅ Badge columns verification complete!')
    console.log('🚀 Badge customization system is ready for production!')
    
  } catch (error) {
    console.error('❌ Error verifying badge columns:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyBadgeColumns()
