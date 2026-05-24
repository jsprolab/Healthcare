import { PrismaClient } from '@prisma/client';

// Prevent multiple PrismaClient instances during Next.js hot-module replacement.
// In production, each invocation creates a fresh client (no HMR, no cache needed).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
