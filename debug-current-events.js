// debug-current-events.js - Debug current events in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugCurrentEvents() {
  try {
    console.log('🔍 Debugging current events in database...\n');
    
    // Get all events
    console.log('1. All events in database:');
    const allEvents = await prisma.event_settings.findMany({
      orderBy: { start_date: 'desc' }
    });
    
    console.log(`Found ${allEvents.length} events total:`);
    allEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.setting_name} = "${event.setting_value}"`);
      console.log(`   Start: ${event.start_date}`);
      console.log(`   End: ${event.end_date}`);
      console.log(`   Event Name: ${event.event_name || 'N/A'}`);
      console.log(`   Description: ${event.description || 'N/A'}\n`);
    });
    
    // Check current time
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}\n`);
    
    // Get active events (same logic as public API)
    console.log('2. Events with setting_value = "true":');
    const enabledEvents = await prisma.event_settings.findMany({
      where: {
        setting_value: 'true'
      }
    });
    
    enabledEvents.forEach((event, index) => {
      const isCurrentlyActive = new Date(event.start_date) <= now && new Date(event.end_date) >= now;
      console.log(`${index + 1}. ${event.setting_name} = "${event.setting_value}"`);
      console.log(`   Start: ${event.start_date} (${new Date(event.start_date) <= now ? 'Past/Current' : 'Future'})`);
      console.log(`   End: ${event.end_date} (${new Date(event.end_date) >= now ? 'Future/Current' : 'Past'})`);
      console.log(`   Currently Active: ${isCurrentlyActive ? '✅ YES' : '❌ NO'}`);
      console.log(`   Event Name: ${event.event_name || 'N/A'}\n`);
    });
    
    // Get currently active events (exact public API logic)
    console.log('3. Currently active events (public API logic):');
    const activeEvents = await prisma.event_settings.findMany({
      where: {
        setting_value: 'true',
        start_date: {
          lte: now
        },
        end_date: {
          gte: now
        }
      }
    });
    
    console.log(`Found ${activeEvents.length} currently active events:`);
    activeEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.setting_name} = "${event.setting_value}"`);
      console.log(`   Event Name: ${event.event_name || 'N/A'}`);
      console.log(`   Description: ${event.description || 'N/A'}`);
    });
    
    // Check for MAIN_EVENT specifically
    console.log('\n4. Looking for MAIN_EVENT specifically:');
    const mainEvent = await prisma.event_settings.findFirst({
      where: {
        setting_name: 'MAIN_EVENT'
      }
    });
    
    if (mainEvent) {
      console.log('✅ MAIN_EVENT found in database:');
      console.log(`   Setting Value: "${mainEvent.setting_value}"`);
      console.log(`   Start: ${mainEvent.start_date}`);
      console.log(`   End: ${mainEvent.end_date}`);
      console.log(`   Event Name: ${mainEvent.event_name || 'N/A'}`);
    } else {
      console.log('❌ MAIN_EVENT not found in database');
      console.log('Available setting_names:');
      allEvents.forEach(event => {
        console.log(`   - ${event.setting_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCurrentEvents();
