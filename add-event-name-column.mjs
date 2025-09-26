/**
 * Add event_name column to event_settings table
 * 
 * This will allow setting_name to remain as identifier (PRIMARY KEY)
 * while event_name becomes the editable display name
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addEventNameColumn() {
  try {
    console.log('🔧 Adding event_name column to event_settings table...\n');
    
    // Step 1: Add event_name column
    console.log('📊 Step 1: Adding event_name column...');
    await prisma.$executeRaw`
      ALTER TABLE event_settings 
      ADD COLUMN IF NOT EXISTS event_name VARCHAR(200)
    `;
    console.log('✅ Column added successfully');
    
    // Step 2: Populate existing events with event_name based on setting_name
    console.log('\n📊 Step 2: Populating event_name for existing events...');
    
    const events = await prisma.event_settings.findMany();
    console.log(`Found ${events.length} existing events to update`);
    
    for (const event of events) {
      if (!event.event_name) {
        // Convert setting_name to readable event_name
        let eventName = event.setting_name
          .replace(/_/g, ' ')
          .replace(/\b\w/g, letter => letter.toUpperCase());
        
        // Special cases for better naming
        if (event.setting_name === 'holiday_mega_boost') {
          eventName = 'Holiday Mega Boost';
        } else if (event.setting_name === 'weekend_double_loyalty') {
          eventName = 'Weekend Double Loyalty';
        }
        
        await prisma.event_settings.update({
          where: { setting_name: event.setting_name },
          data: { event_name: eventName }
        });
        
        console.log(`- Updated "${event.setting_name}" → "${eventName}"`);
      }
    }
    
    // Step 3: Verify the changes
    console.log('\n📊 Step 3: Verifying changes...');
    const updatedEvents = await prisma.event_settings.findMany({
      select: {
        setting_name: true,
        event_name: true,
        setting_value: true,
        description: true
      }
    });
    
    console.log('\nUpdated events structure:');
    updatedEvents.forEach((event, index) => {
      console.log(`${index + 1}. setting_name: "${event.setting_name}"`);
      console.log(`   event_name: "${event.event_name}"`);
      console.log(`   setting_value: ${event.setting_value}`);
      console.log(`   description: ${event.description || 'N/A'}`);
      console.log('');
    });
    
    console.log('🎉 Successfully added event_name column!');
    console.log('\nNext steps:');
    console.log('1. Update admin form to use event_name for display');
    console.log('2. Update API to handle event_name updates');
    console.log('3. Show setting_name as read-only identifier');
    
  } catch (error) {
    console.error('❌ Error adding event_name column:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('💡 Column might already exist, checking current state...');
      
      try {
        const events = await prisma.event_settings.findMany({
          select: {
            setting_name: true,
            event_name: true
          }
        });
        
        console.log('Current events with event_name:');
        events.forEach((event, index) => {
          console.log(`${index + 1}. ${event.setting_name} → ${event.event_name || 'NULL'}`);
        });
      } catch (checkError) {
        console.error('Error checking existing data:', checkError.message);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

addEventNameColumn();