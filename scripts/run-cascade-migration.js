const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🚀 Starting CASCADE DELETE migration...\n');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../prisma/migrations/add_cascade_delete_missing_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    console.log('📝 Executing migration...');
    await prisma.$executeRawUnsafe(migrationSQL);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n🔍 Verifying constraints...');
    
    // Verify the constraints
    const constraints = await prisma.$queryRaw`
      SELECT 
        tc.table_name,
        rc.delete_rule
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('task_submissions', 'reward_redemptions', 'member_transactions')
      ORDER BY tc.table_name
    `;
    
    console.log('\nConstraint status:');
    console.table(constraints);
    
    const cascadeCount = constraints.filter(c => c.delete_rule === 'CASCADE').length;
    
    if (cascadeCount === 3) {
      console.log('\n✅ SUCCESS: All 3 tables now have CASCADE DELETE!');
      console.log('   - task_submissions: CASCADE');
      console.log('   - reward_redemptions: CASCADE');
      console.log('   - member_transactions: CASCADE');
    } else {
      console.log(`\n⚠️  WARNING: Expected 3 CASCADE constraints, found ${cascadeCount}`);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
