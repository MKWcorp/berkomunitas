import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown with better error handling
const gracefulShutdown = async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error during Prisma disconnect:', error);
  }
};

process.on('beforeExit', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default prisma;
