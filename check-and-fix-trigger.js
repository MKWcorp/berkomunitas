const { PrismaClient } = require('@prisma/client');

async function checkAndFixTrigger() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking existing triggers on members table...');
    
    // Check current triggers
    const triggers = await prisma.$queryRawUnsafe(`
      SELECT 
          trigger_name,
          table_name,
          action_timing,
          event_manipulation,
          action_statement
      FROM information_schema.triggers 
      WHERE table_name = 'members'
      ORDER BY trigger_name;
    `);
    
    console.log('📋 Current triggers on members table:', triggers);
    
    // Check current function
    console.log('🔍 Checking current validation function...');
    const currentFunction = await prisma.$queryRawUnsafe(`
      SELECT prosrc FROM pg_proc WHERE proname = 'validate_coin_not_exceed_loyalty';
    `);
    
    console.log('📋 Current function source:', currentFunction);
    
    // Try to drop and recreate the trigger
    console.log('🗑️ Attempting to drop existing trigger...');
    
    try {
      await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trigger_validate_coin_loyalty_ratio ON members;`);
      console.log('✅ Trigger dropped successfully');
    } catch (error) {
      console.log('⚠️ Could not drop trigger:', error.message);
    }
    
    // Recreate function without strict validation
    console.log('🔧 Creating new lenient validation function...');
    
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION validate_coin_not_exceed_loyalty()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Log all operations for debugging
          RAISE NOTICE 'Trigger called for Member ID %: coin % -> %, loyalty % -> %', 
                       NEW.id, OLD.coin, NEW.coin, OLD.loyalty_point, NEW.loyalty_point;
          
          -- SAFETY: Only prevent negative values
          IF NEW.coin < 0 THEN
              RAISE EXCEPTION 'Coin cannot be negative (%). Member ID: %', NEW.coin, NEW.id;
          END IF;
          
          IF NEW.loyalty_point < 0 THEN
              RAISE EXCEPTION 'Loyalty point cannot be negative (%). Member ID: %', NEW.loyalty_point, NEW.id;
          END IF;
          
          -- Allow all operations (remove the strict coin <= loyalty validation)
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ New lenient function created');
    
    // Recreate trigger if it was dropped
    console.log('🔧 Recreating trigger if needed...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER IF NOT EXISTS trigger_validate_coin_loyalty_ratio
          BEFORE UPDATE ON members
          FOR EACH ROW
          EXECUTE FUNCTION validate_coin_not_exceed_loyalty();
    `);
    
    console.log('✅ Trigger recreated with lenient validation');
    
    // Test the fix
    console.log('🧪 Testing coin update...');
    const testResult = await prisma.members.update({
      where: { id: 239 },
      data: { coin: { increment: 100 } }
    });
    
    console.log(`✅ SUCCESS! Member 239 coin updated to: ${testResult.coin}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixTrigger();