// demo-n8n-compatibility.js - Demo kompatibilitas dengan N8N workflow
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testN8nCompatibility() {
  try {
    console.log('🔧 Testing N8N Compatibility untuk setting_value...\n');
    
    // Delete existing test events
    await prisma.event_settings.deleteMany({
      where: {
        setting_name: {
          startsWith: 'test_'
        }
      }
    });
    
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Test berbagai format setting_value
    const testEvents = [
      {
        setting_name: 'test_multiplier_simple',
        setting_value: '2', // 2x multiplier
        description: 'Simple multiplier: 2x (untuk N8N workflow)',
        start_date: now,
        end_date: tomorrow
      },
      {
        setting_name: 'test_multiplier_triple', 
        setting_value: '3', // 3x multiplier
        description: 'Triple multiplier: 3x (untuk N8N workflow)',
        start_date: now,
        end_date: tomorrow
      },
      {
        setting_name: 'test_percentage_200',
        setting_value: '200', // 200% boost
        description: 'Percentage format: 200% boost',
        start_date: now,
        end_date: tomorrow
      },
      {
        setting_name: 'test_percentage_500',
        setting_value: '500', // 500% boost
        description: 'Percentage format: 500% boost',
        start_date: now,
        end_date: tomorrow
      },
      {
        setting_name: 'test_boolean_true',
        setting_value: 'true', // Boolean activation
        description: 'Boolean format: true (gunakan default dari kode)',
        start_date: now,
        end_date: tomorrow
      }
    ];
    
    // Create test events
    for (const event of testEvents) {
      await prisma.event_settings.create({ data: event });
    }
    
    console.log('✅ Test events created\n');
    
    // Test interpretation logic
    console.log('🧪 TESTING INTERPRETATION LOGIC:\n');
    
    for (const event of testEvents) {
      const settingValue = event.setting_value;
      let boostPercentage = 200; // default
      let pointValue = 20; // default
      let multiplier = 2.0; // default
      
      console.log(`📋 Event: ${event.setting_name}`);
      console.log(`   setting_value: "${settingValue}"`);
      
      // Parse logic (sama seperti di useEventBoost.js)
      if (!isNaN(parseFloat(settingValue)) && parseFloat(settingValue) > 0) {
        const numericValue = parseFloat(settingValue);
        
        if (numericValue <= 10) {
          // 1-10 = multiplier langsung untuk N8N
          boostPercentage = numericValue * 100;
          pointValue = Math.round(10 * numericValue);
          multiplier = numericValue;
          console.log(`   🎯 MULTIPLIER MODE: ${numericValue}x`);
        } else {
          // >10 = percentage langsung
          boostPercentage = numericValue;
          pointValue = Math.round(numericValue / 10);
          multiplier = numericValue / 100;
          console.log(`   📊 PERCENTAGE MODE: ${numericValue}%`);
        }
      } else {
        console.log(`   ✅ BOOLEAN MODE: menggunakan default`);
      }
      
      console.log(`   → Frontend Display: ${boostPercentage}% boost`);
      console.log(`   → N8N Multiplier: ${multiplier}x`);
      console.log(`   → Point Value: ${pointValue} poin`);
      console.log(`   → SQL for N8N: (10 * ${multiplier})::integer = ${Math.round(10 * multiplier)} poin\n`);
    }
    
    console.log('🚀 N8N WORKFLOW INTEGRATION:\n');
    console.log('Gunakan query ini di N8N untuk dynamic weekend boost:');
    console.log(`
-- N8N Dynamic Weekend Query dengan event_settings integration:
WITH event_multiplier AS (
  SELECT 
    CASE 
      WHEN setting_value ~ '^[0-9]+(\\\.[0-9]+)?$' THEN
        CASE 
          WHEN setting_value::numeric <= 10 THEN setting_value::numeric
          ELSE setting_value::numeric / 100
        END
      ELSE 2.0  -- default fallback
    END as multiplier
  FROM event_settings 
  WHERE setting_name = 'weekend_point_value'
    AND start_date <= NOW() 
    AND end_date >= NOW()
  LIMIT 1
),
point_calculation AS (
  SELECT 
    COALESCE(em.multiplier, 1.0) as final_multiplier,
    (10 * COALESCE(em.multiplier, 1.0))::integer as final_points
  FROM event_multiplier em
)
INSERT INTO loyalty_point_history (member_id, event, point, task_id, event_type)
SELECT 
  $1 as member_id,
  'Penyelesaian Tugas (Event: ' || pc.final_multiplier || 'x)',
  pc.final_points,
  $2 as task_id,
  'event_boost'
FROM point_calculation pc;
    `);
    
    console.log('\n📝 CONTOH PENGGUNAAN:');
    console.log('• setting_value = "2" → 2x multiplier → 20 poin');
    console.log('• setting_value = "3" → 3x multiplier → 30 poin');
    console.log('• setting_value = "200" → 200% boost → 20 poin');
    console.log('• setting_value = "500" → 500% boost → 50 poin');
    console.log('• setting_value = "true" → Default boost → 20 poin');
    
    // Cleanup
    await prisma.event_settings.deleteMany({
      where: {
        setting_name: {
          startsWith: 'test_'
        }
      }
    });
    
    console.log('\n✅ Test events cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testN8nCompatibility();
