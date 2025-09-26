// Database migration script for reward categories and shipping
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('add-reward-categories-and-shipping.sql', 'utf8');
    
    // Split SQL statements and execute them one by one
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}...`);
      
      try {
        await prisma.$executeRawUnsafe(statement + ';');
        console.log(`✅ Statement ${i + 1} completed successfully`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Statement ${i + 1} skipped (already exists): ${error.message}`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.log(`Statement was: ${statement}`);
        }
      }
    }
    
    console.log('\n🎉 Migration completed!');
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    
    // Check if reward_categories table exists
    try {
      const categories = await prisma.$queryRaw`SELECT COUNT(*) as count FROM reward_categories`;
      console.log(`✅ reward_categories table exists with ${categories[0].count} records`);
    } catch (error) {
      console.log('❌ reward_categories table not found');
    }
    
    // Check if new columns exist in rewards table
    try {
      const result = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'rewards' 
        AND column_name IN ('category_id', 'required_privilege', 'is_exclusive')
      `;
      console.log(`✅ Added ${result.length} new columns to rewards table`);
    } catch (error) {
      console.log('❌ Failed to verify rewards table columns');
    }
    
    // Check if new columns exist in reward_redemptions table
    try {
      const result = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'reward_redemptions' 
        AND column_name IN ('shipping_tracking', 'shipping_notes', 'shipping_method')
      `;
      console.log(`✅ Added ${result.length} new columns to reward_redemptions table`);
    } catch (error) {
      console.log('❌ Failed to verify reward_redemptions table columns');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();