/**
 * Prisma client singleton.
 *
 * A single instance is reused across the process. In development, `node --watch`
 * re-imports modules on reload, so the instance is cached on `globalThis` to
 * avoid exhausting the database connection pool.
 */
import { PrismaClient } from '@prisma/client';
import { env, isProduction } from './env.js';

const createClient = () =>
  new PrismaClient({
    log: isProduction ? ['error'] : ['warn', 'error'],
  });

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__prisma ?? createClient();

if (!isProduction) {
  globalForPrisma.__prisma = prisma;
}

/** Closes the database connection — used during graceful shutdown. */
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

export { env };
