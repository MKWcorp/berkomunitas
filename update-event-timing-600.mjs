/**
 * Update Event Timing - Set holiday_mega_boost active today with 600% boost
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateEventTiming() {
  try {
    console.log('🔧 Updating event timing for 600% boost test...\n');
    
    // Get current date in local timezone
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Set start time to 00:00:00 today
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    
    // Set end time to 23:59:59 today
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    
    console.log('📅 Setting event timing:');
    console.log(`- Start: ${startDate.toISOString()} (${startDate.toLocaleString()})`);
    console.log(`- End: ${endDate.toISOString()} (${endDate.toLocaleString()})`);
    console.log(`- Current: ${now.toISOString()} (${now.toLocaleString()})`);
    
    // Update the event
    const updatedEvent = await prisma.event_settings.update({
      where: { setting_name: 'holiday_mega_boost' },
      data: {
        setting_value: '600', // Ensure it's 600% boost
        description: 'Holiday Mega Boost - 6x points untuk celebration!', // Update description
        start_date: startDate,
        end_date: endDate
      }
    });
    
    console.log('\n✅ Event updated successfully!');
    console.log('Updated event:', {
      setting_name: updatedEvent.setting_name,
      setting_value: updatedEvent.setting_value,
      start_date: updatedEvent.start_date.toISOString(),
      end_date: updatedEvent.end_date.toISOString()
    });
    
    // Verify it's now active
    const isActive = now >= startDate && now <= endDate;
    console.log(`\n🎯 Event is now active: ${isActive}`);
    
    if (isActive) {
      console.log('🎉 SUCCESS: 600% boost should now appear on /tugas page!');
      console.log(`- Boost: ${updatedEvent.setting_value}%`);
      console.log(`- Points per task: ${Math.round(parseInt(updatedEvent.setting_value) / 10)}`);
    } else {
      console.log('❌ Something went wrong with timing calculation');
    }
    
  } catch (error) {
    console.error('❌ Error updating event:', error.message);
    
    if (error.code === 'P2025') {
      console.log('\n💡 Event "holiday_mega_boost" not found. Creating new one...');
      
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        
        const newEvent = await prisma.event_settings.create({
          data: {
            setting_name: 'holiday_mega_boost',
            setting_value: '600',
            start_date: startDate,
            end_date: endDate
          }
        });
        
        console.log('✅ New event created:', newEvent);
      } catch (createError) {
        console.error('❌ Error creating event:', createError.message);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

updateEventTiming();