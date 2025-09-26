// Create event_settings table using Prisma
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createEventSettingsTable() {
  try {
    console.log('🔧 Creating event_settings table...\n');
    
    // Create table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS event_settings (
          setting_name VARCHAR(100) PRIMARY KEY,
          setting_value INTEGER NOT NULL,
          start_date TIMESTAMPTZ NOT NULL,
          end_date TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✅ Table event_settings created successfully');
    
    // Create index
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_event_settings_dates ON event_settings(start_date, end_date)
    `;
    console.log('✅ Index idx_event_settings_dates created successfully');
    
    // Insert example data
    await prisma.$executeRaw`
      INSERT INTO event_settings (setting_name, setting_value, start_date, end_date) VALUES
      ('weekend_double_loyalty', 100, '2025-09-14 00:00:00+07', '2025-09-15 23:59:59+07')
      ON CONFLICT (setting_name) DO NOTHING
    `;
    console.log('✅ Example data inserted successfully');
    
    // Verify table creation
    const events = await prisma.$queryRaw`SELECT * FROM event_settings ORDER BY start_date DESC`;
    console.log(`\n📊 Events found: ${events.length}`);
    
    if (events.length > 0) {
      console.log('\n📋 Events data:');
      events.forEach((event, idx) => {
        console.log(`${idx + 1}. ${event.setting_name}`);
        console.log(`   Value: ${event.setting_value}%`);
        console.log(`   Period: ${event.start_date} to ${event.end_date}`);
        console.log('');
      });
    }
    
    console.log('🎉 event_settings table is ready for use!');
    
  } catch (error) {
    console.error('❌ Error creating event_settings table:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createEventSettingsTable();
