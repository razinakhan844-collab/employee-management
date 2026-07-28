/**
 * Environment configuration.
 *
 * Loads `.env` and validates every variable the app needs at boot time, so a
 * misconfigured deployment fails immediately with a clear message instead of
 * throwing a confusing error on the first request.
 */
import dotenv from 'dotenv';

dotenv.config();

/** Reads a required variable, or exits with a readable message. */
const required = (key) => {
  const value = process.env[key];
  if (!value || !value.trim()) {
    // eslint-disable-next-line no-console
    console.error(`[config] Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value.trim();
};

/** Reads an optional variable with a fallback. */
const optional = (key, fallback) => process.env[key]?.trim() || fallback;

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: Number(optional('PORT', '5000')),

  databaseUrl: required('DATABASE_URL'),

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: optional('JWT_EXPIRES_IN', '1d'),
  },

  bcryptSaltRounds: Number(optional('BCRYPT_SALT_ROUNDS', '10')),

  /** Comma-separated list of allowed origins, or `*`. */
  corsOrigin: optional('CORS_ORIGIN', '*'),

  /** Credentials for the manager account created by the seed script. */
  seed: {
    managerName: optional('SEED_MANAGER_NAME', 'System Manager'),
    managerEmail: optional('SEED_MANAGER_EMAIL', 'manager@company.com'),
    managerPassword: optional('SEED_MANAGER_PASSWORD', 'Manager@123'),
  },
};

export const isProduction = env.nodeEnv === 'production';
