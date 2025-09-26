import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function runBadgeShieldsMigration() {
  try {
    console.log('🚀 Starting Shields.io badge migration...');

    // Check if columns already exist
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'badges' 
      AND column_name IN ('badge_color', 'badge_style');
    `;

    if (result.length < 2) {
      console.log('📋 Adding badge_color and badge_style columns...');
      
      await prisma.$executeRaw`
        ALTER TABLE badges 
        ADD COLUMN IF NOT EXISTS badge_color VARCHAR(20) DEFAULT 'blue',
        ADD COLUMN IF NOT EXISTS badge_style VARCHAR(20) DEFAULT 'flat';
      `;

      console.log('✅ Columns added successfully');
    } else {
      console.log('ℹ️  Columns already exist');
    }

    // Update existing badges with default values
    console.log('🔄 Updating existing badges with default values...');
    
    const updateResult = await prisma.badges.updateMany({
      where: {
        OR: [
          { badge_color: null },
          { badge_style: null },
          { badge_color: '' },
          { badge_style: '' }
        ]
      },
      data: {
        badge_color: 'blue',
        badge_style: 'flat'
      }
    });

    console.log(`✅ Updated ${updateResult.count} badges with default values`);

    // Show current badges
    const badges = await prisma.badges.findMany({
      select: {
        id: true,
        badge_name: true,
        badge_color: true,
        badge_style: true
      }
    });

    console.log('\n📊 Current badges:');
    console.table(badges);

    console.log('\n🎉 Shields.io badge migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
runBadgeShieldsMigration();
