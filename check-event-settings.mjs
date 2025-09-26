// Debug script untuk memeriksa tabel event_settings
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEventSettings() {
  try {
    console.log('🔍 Checking event_settings table...\n');
    
    // Cek apakah tabel ada dengan cara mencoba query
    try {
      const events = await prisma.$queryRaw`SELECT * FROM event_settings ORDER BY start_date DESC`;
      console.log('✅ Table event_settings exists');
      console.log(`📊 Events found: ${events.length}`);
      
      if (events.length > 0) {
        console.log('\n📋 Events data:');
        events.forEach((event, idx) => {
          console.log(`${idx + 1}. ${event.setting_name}`);
          console.log(`   Value: ${event.setting_value}%`);
          console.log(`   Period: ${event.start_date} to ${event.end_date}`);
          console.log('');
        });
      } else {
        console.log('⚠️ No events found in table');
      }
      
    } catch (tableError) {
      if (tableError.message.includes('does not exist')) {
        console.log('❌ Table event_settings does not exist!');
        console.log('💡 Need to run: create-event-settings-table.sql');
        return;
      }
      throw tableError;
    }
    
    // Test API endpoint logic simulation
    console.log('\n🧪 Testing API logic...');
    const currentDate = new Date();
    console.log(`Current time: ${currentDate.toISOString()}`);
    
    const activeEvents = await prisma.$queryRaw`
      SELECT * FROM event_settings 
      WHERE start_date <= ${currentDate} 
      AND end_date >= ${currentDate}
    `;
    
    console.log(`🟢 Active events now: ${activeEvents.length}`);
    if (activeEvents.length > 0) {
      activeEvents.forEach(event => {
        console.log(`  - ${event.setting_name}: ${event.setting_value}%`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkEventSettings();
