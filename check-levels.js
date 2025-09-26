import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLevels() {
  try {
    console.log('=== Checking BC Levels ===');
    
    // Get sample levels from database
    const bcData = await prisma.bc_drwskincare_api.findMany({
      select: {
        resellerId: true,
        nama_reseller: true,
        level: true
      },
      take: 10
    });
    
    console.log('Sample BC data with levels:');
    bcData.forEach(bc => {
      console.log(`- ${bc.resellerId}: ${bc.nama_reseller} (Level: ${bc.level})`);
    });
    
    // Get unique levels
    const uniqueLevels = await prisma.$queryRaw`
      SELECT DISTINCT level, COUNT(*) as count 
      FROM bc_drwskincare_api 
      WHERE level IS NOT NULL 
      GROUP BY level 
      ORDER BY count DESC
    `;
    
    console.log('\nUnique levels in database:');
    uniqueLevels.forEach(item => {
      console.log(`- ${item.level}: ${item.count} people`);
    });
    
    // Check our test user specifically
    const testUser = await prisma.bc_drwskincare_api.findFirst({
      where: {
        resellerId: '282-302-1009-1003-2001'
      },
      select: {
        resellerId: true,
        nama_reseller: true,
        level: true,
        nomor_hp: true
      }
    });
    
    console.log('\nTest user data:', testUser);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLevels();