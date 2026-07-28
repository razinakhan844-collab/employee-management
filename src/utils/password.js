/**
 * Password hashing helpers. All hashing goes through this module so the cost
 * factor is configured in exactly one place.
 */
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

/**
 * Hashes a plaintext password.
 *
 * @param {string} plainPassword
 * @returns {Promise<string>} bcrypt hash
 */
export const hashPassword = async (plainPassword) =>
  bcrypt.hash(plainPassword, env.bcryptSaltRounds);

/**
 * Compares a plaintext password against a bcrypt hash.
 *
 * @param {string} plainPassword
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (plainPassword, hash) =>
  bcrypt.compare(plainPassword, hash);
