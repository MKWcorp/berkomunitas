// test-auto-activation.js - Test auto-activation logic tanpa server
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAutoActivation() {
  try {
    console.log('🧪 Testing Auto-Activation Logic...\n');
    
    const now = new Date();
    console.log(`Current time: ${now.toLocaleString()}\n`);
    
    // Get events dalam periode waktu aktif
    const allEvents = await prisma.event_settings.findMany({
      where: {
        start_date: { lte: now },
        end_date: { gte: now }
      },
      orderBy: { start_date: 'desc' }
    });
    
    console.log(`📊 Events dalam periode waktu: ${allEvents.length}\n`);
    
    // Test auto-activation logic
    const activeEvents = allEvents.filter(event => {
      const settingValue = event.setting_value;
      
      // Boolean activation
      const isBooleanActive = settingValue === 'true' || settingValue === 'active';
      
      // Numeric boost (angka > 0)
      const isNumericBoost = !isNaN(parseFloat(settingValue)) && parseFloat(settingValue) > 0;
      
      const isActive = isBooleanActive || isNumericBoost;
      
      console.log(`🔍 ${event.setting_name}:`);
      console.log(`   setting_value: "${settingValue}"`);
      console.log(`   isBooleanActive: ${isBooleanActive}`);
      console.log(`   isNumericBoost: ${isNumericBoost} (value: ${parseFloat(settingValue) || 'NaN'})`);
      console.log(`   => AUTO-ACTIVE: ${isActive ? '✅ YES' : '❌ NO'}\n`);
      
      return isActive;
    });
    
    console.log(`🎯 SUMMARY:`);
    console.log(`   Total events in time period: ${allEvents.length}`);
    console.log(`   Auto-activated events: ${activeEvents.length}\n`);
    
    console.log(`✅ ACTIVE EVENTS:`);
    activeEvents.forEach((event, i) => {
      const boost = !isNaN(parseFloat(event.setting_value)) ? 
        `${event.setting_value}%` : 'Default from code';
      
      console.log(`${i+1}. ${event.setting_name}`);
      console.log(`   Boost: ${boost}`);
      console.log(`   Period: ${new Date(event.start_date).toLocaleString()} → ${new Date(event.end_date).toLocaleString()}`);
      console.log(`   Description: ${event.description}\n`);
    });
    
    console.log(`🚀 Use Cases:`);
    console.log(`   • setting_value "300" = 300% boost (auto-active)`);
    console.log(`   • setting_value "true" = Default boost from code (auto-active)`);
    console.log(`   • setting_value "false" = Not active`);
    console.log(`   • setting_value "0" = Not active (boost 0%)`);
    console.log(`   • Multiple events dapat aktif bersamaan dengan boost berbeda!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAutoActivation();
