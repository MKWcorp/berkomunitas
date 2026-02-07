import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Add connection_limit to DATABASE_URL if not present
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  
  // Parse URL to check if connection_limit exists
  if (url.includes('connection_limit')) {
    return url;
  }
  
  // Aggressive connection pooling: 2 for production, 10 for dev (hot reload needs spikes)
  const limit = process.env.NODE_ENV === 'production' ? 2 : 10;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}connection_limit=${limit}&pool_timeout=20`;
};

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  // Aggressive connection pooling
  __internal: {
    engine: {
      connectionTimeout: 10000,
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown for production only
if (process.env.NODE_ENV === 'production') {
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
}

export default prisma;
