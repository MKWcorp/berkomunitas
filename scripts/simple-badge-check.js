// Simple query to check member_badges data
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to database...');
    
    const count = await prisma.member_badges.count();
    console.log('Total member_badges:', count);
    
    const badges = await prisma.member_badges.findMany({
      take: 3
    });
    console.log('Sample data:', badges);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
