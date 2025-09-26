import { PrismaClient } from '@prisma/client'

// Add prismas to the NodeJS global type
// @ts-ignore
const globalForPrisma = global

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error', 'warn'], // Reduced logging to prevent spam
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Optimized connection pool configuration
  __internal: {
    engine: {
      maxConnections: 15, // Increased from 10
      connectionTimeout: 8000, // 8 seconds timeout (increased)
      poolTimeout: 15000, // 15 seconds pool timeout (increased)
      idleTimeout: 300000, // 5 minutes idle timeout
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma
