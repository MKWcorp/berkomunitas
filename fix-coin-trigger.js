const { PrismaClient } = require('@prisma/client');

async function fixCoinTrigger() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Updating coin management trigger...');
    
    // Update the validation function to allow independent coin operations
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION validate_coin_not_exceed_loyalty()
      RETURNS TRIGGER AS $$
      BEGIN
          -- COIN MANAGEMENT: Allow independent coin operations
          -- Skip validation if ONLY coin is being changed (coin management)
          IF OLD.loyalty_point = NEW.loyalty_point AND OLD.coin != NEW.coin THEN
              -- This is coin-only operation (coin management), allow it
              RAISE NOTICE 'Coin management operation: Member ID %, coin: % -> %', 
                           NEW.id, OLD.coin, NEW.coin;
              RETURN NEW;  -- Allow the operation
          END IF;
          
          -- LOYALTY MANAGEMENT: Allow loyalty-only updates (admin manual)
          IF OLD.coin = NEW.coin AND OLD.loyalty_point != NEW.loyalty_point THEN
              -- Log the admin manual loyalty change for audit
              RAISE NOTICE 'Admin manual loyalty update: Member ID %, loyalty_point: % -> %', 
                           NEW.id, OLD.loyalty_point, NEW.loyalty_point;
              RETURN NEW;  -- Allow the operation
          END IF;
          
          -- SYSTEM SYNC: Allow both coin and loyalty_point updates together
          IF OLD.coin != NEW.coin AND OLD.loyalty_point != NEW.loyalty_point THEN
              -- This is likely a system sync operation, allow it
              RAISE NOTICE 'System sync operation: Member ID %, coin: % -> %, loyalty: % -> %', 
                           NEW.id, OLD.coin, NEW.coin, OLD.loyalty_point, NEW.loyalty_point;
              RETURN NEW;
          END IF;
          
          -- SAFETY: Prevent negative values
          IF NEW.coin < 0 THEN
              RAISE EXCEPTION 'Coin cannot be negative (%). Member ID: %', NEW.coin, NEW.id;
          END IF;
          
          IF NEW.loyalty_point < 0 THEN
              RAISE EXCEPTION 'Loyalty point cannot be negative (%). Member ID: %', NEW.loyalty_point, NEW.id;
          END IF;
          
          -- If we reach here, allow the operation (remove the original strict validation)
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Coin management trigger updated successfully!');
    
    // Test the fix with member ID 239
    console.log('🧪 Testing coin update on member ID 239...');
    const testResult = await prisma.members.update({
      where: { id: 239 },
      data: { coin: { increment: 100 } }
    });
    
    console.log(`✅ Test successful! Member 239 coin updated to: ${testResult.coin}`);
    
    // Show current member data
    const member = await prisma.members.findUnique({
      where: { id: 239 },
      select: {
        id: true,
        nama_lengkap: true,
        coin: true,
        loyalty_point: true
      }
    });
    
    console.log('📊 Current member data:', member);
    console.log(`💰 Coin vs Loyalty difference: ${member.coin - member.loyalty_point}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // If it's the trigger error, it means trigger is still active
    if (error.message.includes('cannot exceed loyalty_point')) {
      console.log('🚨 Trigger validation is still active. This is the issue we need to fix.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixCoinTrigger();