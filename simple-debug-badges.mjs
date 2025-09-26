// Debug Member Badges - Simple Version
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking member badges...');
    
    const count = await prisma.member_badges.count();
    console.log('Total member_badges:', count);
    
    const sample = await prisma.member_badges.findFirst({
      include: {
        members: true,
        badges: true
      }
    });
    
    console.log('Sample record:', JSON.stringify(sample, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
