// demo-multiple-events.js - Demo sistem multiple events dengan auto-activation
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMultipleEvents() {
  try {
    console.log('🚀 Creating multiple events untuk demo auto-activation...\n');
    
    const now = new Date();
    
    // Event 1: Weekend Boost - Aktif sekarang
    const weekendEvent = {
      setting_name: 'weekend_point_value',
      setting_value: '300', // 300% boost
      description: 'Weekend Special - Triple points untuk semua tugas!',
      start_date: new Date(now.getTime() - 1000 * 60 * 60), // 1 jam yang lalu
      end_date: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2) // 2 hari ke depan
    };
    
    // Event 2: Holiday Mega Boost - Akan aktif besok
    const holidayEvent = {
      setting_name: 'holiday_mega_boost',
      setting_value: '500', // 500% boost  
      description: 'Holiday Mega Boost - 5x points untuk celebration!',
      start_date: new Date(now.getTime() + 1000 * 60 * 60 * 24), // Besok
      end_date: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3) // 3 hari dari sekarang
    };
    
    // Event 3: Flash Sale - Sudah berakhir
    const flashSaleEvent = {
      setting_name: 'flash_sale_boost',
      setting_value: '1000', // 1000% boost
      description: 'Flash Sale Boost - Mega 10x points (expired)',
      start_date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5), // 5 hari lalu
      end_date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2) // 2 hari lalu (expired)
    };
    
    // Event 4: Birthday Special - Boolean activation (klasik)
    const birthdayEvent = {
      setting_name: 'birthday_special_boost',
      setting_value: 'true', // Boolean style
      description: 'Birthday Special - Fixed 200% boost dari kode!',
      start_date: new Date(now.getTime() - 1000 * 60 * 30), // 30 menit lalu
      end_date: new Date(now.getTime() + 1000 * 60 * 60 * 6) // 6 jam ke depan
    };
    
    const events = [weekendEvent, holidayEvent, flashSaleEvent, birthdayEvent];
    
    // Delete existing events first
    await prisma.event_settings.deleteMany({
      where: {
        setting_name: {
          in: events.map(e => e.setting_name)
        }
      }
    });
    
    // Create new events
    for (const event of events) {
      await prisma.event_settings.create({
        data: event
      });
      
      const status = isEventActive(event.start_date, event.end_date) ? '✅ AKTIF' : '❌ TIDAK AKTIF';
      const boost = !isNaN(parseFloat(event.setting_value)) ? `${event.setting_value}%` : 'Default%';
      
      console.log(`📅 ${event.setting_name}`);
      console.log(`   Status: ${status}`);
      console.log(`   Boost: ${boost}`);
      console.log(`   Start: ${event.start_date.toLocaleString()}`);
      console.log(`   End: ${event.end_date.toLocaleString()}`);
      console.log(`   Deskripsi: ${event.description}\n`);
    }
    
    console.log('🎯 Summary Auto-Activation Logic:');
    console.log('   ✅ Event otomatis AKTIF jika sekarang dalam periode start_date ↔ end_date');
    console.log('   🔢 setting_value angka = boost percentage (300 = 300%)');
    console.log('   ✅ setting_value "true" = gunakan default boost dari kode');
    console.log('   📝 Nama event (setting_name) = ID unik untuk multiple events');
    console.log('   ⏰ Real-time checking setiap kali hook dipanggil\n');
    
    console.log('🧪 Test multiple events:');
    console.log('   1. weekend_point_value → WEEKEND_BOOST hook → 300% boost');
    console.log('   2. holiday_mega_boost → Custom hook → 500% boost (besok)');
    console.log('   3. birthday_special_boost → Custom hook → Default boost');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

function isEventActive(startDate, endDate) {
  const now = new Date();
  return now >= startDate && now <= endDate;
}

createMultipleEvents();
