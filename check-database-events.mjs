/**
 * Check Database Events - Direct database query to see current events
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseEvents() {
  try {
    console.log('🔍 Checking events directly from database...\n');
    
    // Get all events from database
    const events = await prisma.event_settings.findMany({
      orderBy: { start_date: 'desc' }
    });
    
    console.log(`📊 Found ${events.length} events in database:\n`);
    
    const now = new Date();
    
    events.forEach((event, index) => {
      console.log(`Event ${index + 1}:`);
      console.log(`- setting_name: "${event.setting_name}"`);
      console.log(`- setting_value: ${event.setting_value} (type: ${typeof event.setting_value})`);
      console.log(`- start_date: ${event.start_date.toISOString()}`);
      console.log(`- end_date: ${event.end_date.toISOString()}`);
      console.log(`- created_at: ${event.created_at?.toISOString() || 'N/A'}`);
      console.log(`- updated_at: ${event.updated_at?.toISOString() || 'N/A'}`);
      
      // Check if active
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      const isInTimePeriod = now >= startDate && now <= endDate;
      
      console.log(`- Current time: ${now.toISOString()}`);
      console.log(`- Is currently active: ${isInTimePeriod}`);
      
      if (isInTimePeriod) {
        console.log('✅ This event should be showing on tugas page!');
      } else {
        if (now < startDate) {
          const minutesToStart = Math.round((startDate - now) / 1000 / 60);
          console.log(`⏳ Event starts in ${minutesToStart} minutes`);
        } else {
          const minutesEnded = Math.round((now - endDate) / 1000 / 60);
          console.log(`⏰ Event ended ${minutesEnded} minutes ago`);
        }
      }
      
      console.log('');
    });
    
    // Focus on 600 value events
    const events600 = events.filter(e => e.setting_value == 600 || e.setting_value === '600');
    
    if (events600.length > 0) {
      console.log('🎯 Events with 600% boost:\n');
      events600.forEach((event, index) => {
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        const isInTimePeriod = now >= startDate && now <= endDate;
        
        console.log(`600% Event ${index + 1}: "${event.setting_name}"`);
        console.log(`- Active: ${isInTimePeriod}`);
        console.log(`- Start: ${startDate.toISOString()}`);
        console.log(`- End: ${endDate.toISOString()}`);
        console.log('');
      });
    } else {
      console.log('❌ No events found with setting_value 600');
      console.log('   Event might not have been saved correctly');
    }
    
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure database is accessible');
    console.log('2. Check if event_settings table exists'); 
    console.log('3. Verify Prisma configuration');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseEvents();