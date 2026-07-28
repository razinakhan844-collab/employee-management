/**
 * JWT signing and verification.
 *
 * The token payload deliberately carries only `sub` (user id) and `role`.
 * Everything else is read from the database on each request, so a change to a
 * user's role or status takes effect immediately rather than at token expiry.
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';

/**
 * Signs an access token for a user.
 *
 * @param {{id: string, role: string}} user
 * @returns {string} Signed JWT
 */
export const signAccessToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });

/**
 * Verifies an access token.
 *
 * @param {string} token
 * @returns {{sub: string, role: string, iat: number, exp: number}}
 * @throws {ApiError} 401 when the token is expired or otherwise invalid
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Session expired, please log in again');
    }
    throw ApiError.unauthorized('Invalid authentication token');
  }
};
