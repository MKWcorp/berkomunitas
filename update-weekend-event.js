// update-weekend-event.js - Update weekend event to be boost-compatible
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateWeekendEvent() {
  try {
    console.log('🔄 Updating weekend event to be boost-compatible...\n');
    
    // Check current event
    const currentEvent = await prisma.event_settings.findFirst({
      where: {
        setting_name: 'weekend_point_value'
      }
    });
    
    if (currentEvent) {
      console.log('📅 Current event found:');
      console.log(`   Setting: ${currentEvent.setting_name} = "${currentEvent.setting_value}"`);
      console.log(`   Start: ${currentEvent.start_date}`);
      console.log(`   End: ${currentEvent.end_date}`);
      console.log(`   Name: ${currentEvent.event_name || 'N/A'}`);
      console.log(`   Description: ${currentEvent.description || 'N/A'}\n`);
      
      // Update to make it boost-compatible
      const updatedEvent = await prisma.event_settings.update({
        where: {
          setting_name: 'weekend_point_value'
        },
        data: {
          setting_value: 'true', // Change from "2000" to "true" for activation
          description: 'Dapatkan poin ekstra di akhir pekan! Boost 150% untuk semua tugas.',
          start_date: new Date(), // Start now
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // End in 7 days
        }
      });
      
      console.log('✅ Event updated successfully:');
      console.log(`   Setting: ${updatedEvent.setting_name} = "${updatedEvent.setting_value}"`);
      console.log(`   Name: ${updatedEvent.event_name}`);
      console.log(`   Description: ${updatedEvent.description}\n`);
      
      // Check if event is currently active
      const now = new Date();
      const isActive = new Date(updatedEvent.start_date) <= now && new Date(updatedEvent.end_date) >= now;
      
      console.log(`⏰ Current time: ${now.toISOString()}`);
      console.log(`🎯 Event is currently: ${isActive ? '✅ ACTIVE' : '❌ INACTIVE'}`);
      
      if (!isActive) {
        console.log('\n🔧 Event is not active. Would you like to extend it?');
        console.log(`   Start: ${updatedEvent.start_date}`);
        console.log(`   End: ${updatedEvent.end_date}`);
        
        // Extend event to be active now
        const newEnd = new Date();
        newEnd.setDate(newEnd.getDate() + 7); // Active for next 7 days
        
        const extendedEvent = await prisma.event_settings.update({
          where: {
            setting_name: 'weekend_point_value'
          },
          data: {
            start_date: new Date(), // Start now
            end_date: newEnd
          }
        });
        
        console.log('\n✅ Event extended to be active now:');
        console.log(`   New Start: ${extendedEvent.start_date}`);
        console.log(`   New End: ${extendedEvent.end_date}`);
      }
      
    } else {
      console.log('❌ No weekend_point_value event found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateWeekendEvent();
