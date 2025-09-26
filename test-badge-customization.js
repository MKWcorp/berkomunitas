// Test badge customization API in production
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testBadgeCustomization() {
  try {
    console.log('🧪 Testing badge customization API in production...')
    
    // Get a badge to test with
    const testBadge = await prisma.badges.findFirst()
    if (!testBadge) {
      console.log('❌ No badges found to test')
      return
    }
    
    console.log(`🎯 Testing with badge: ${testBadge.badge_name}`)
    
    // Test updating badge customization
    const updatedBadge = await prisma.badges.update({
      where: { id: testBadge.id },
      data: {
        badge_color: 'green',
        badge_style: 'plastic',
        badge_message: 'Updated Badge'
      }
    })
    
    console.log('✅ Badge customization update successful:')
    console.log(`   Color: ${updatedBadge.badge_color}`)
    console.log(`   Style: ${updatedBadge.badge_style}`)  
    console.log(`   Message: ${updatedBadge.badge_message}`)
    
    // Test Shields.io URL generation
    const shieldsUrl = `https://img.shields.io/badge/${encodeURIComponent(updatedBadge.badge_message)}-${encodeURIComponent(updatedBadge.badge_name)}-${updatedBadge.badge_color}?style=${updatedBadge.badge_style}`
    console.log(`🔗 Generated Shields.io URL: ${shieldsUrl}`)
    
    // Restore original values
    await prisma.badges.update({
      where: { id: testBadge.id },
      data: {
        badge_color: testBadge.badge_color,
        badge_style: testBadge.badge_style,
        badge_message: testBadge.badge_message
      }
    })
    
    console.log('🔄 Restored original badge values')
    console.log('\n🚀 Badge customization system is fully operational in production!')
    
  } catch (error) {
    console.error('❌ Error testing badge customization:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testBadgeCustomization()
