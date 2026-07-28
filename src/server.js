/**
 * Process entry point.
 *
 * Verifies the database connection before accepting traffic, and shuts down
 * gracefully so in-flight requests can finish and the connection pool closes
 * cleanly.
 */
import app from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma, prisma } from './config/prisma.js';

const startServer = async () => {
  try {
    // Fail fast: a bad DATABASE_URL should stop the boot, not surface later as
    // a 500 on the first request.
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('[db] Connected to PostgreSQL');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[db] Failed to connect to the database:', error.message);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] Listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  /** Stops accepting connections, then releases the database pool. */
  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`\n[server] ${signal} received, shutting down gracefully...`);

    server.close(async () => {
      await disconnectPrisma();
      // eslint-disable-next-line no-console
      console.log('[server] Shutdown complete');
      process.exit(0);
    });

    // Don't hang forever on a stuck connection.
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error('[server] Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // A crash left running in an unknown state is worse than a restart — log and
  // exit so the process manager can bring up a clean instance.
  process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('[process] Unhandled rejection:', reason);
    shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (error) => {
    // eslint-disable-next-line no-console
    console.error('[process] Uncaught exception:', error);
    process.exit(1);
  });
};

startServer();
