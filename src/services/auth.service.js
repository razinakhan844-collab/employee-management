/**
 * Authentication service.
 */
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken } from '../utils/jwt.js';
import { comparePassword } from '../utils/password.js';
import { serializeUser } from '../utils/serializers.js';

/**
 * Authenticates a user and issues an access token.
 *
 * The same generic message is returned for both an unknown email and a wrong
 * password, so the endpoint cannot be used to enumerate registered accounts.
 *
 * @param {{email: string, password: string}} credentials
 * @returns {Promise<{accessToken: string, user: object, role: string}>}
 * @throws {ApiError} 401 on bad credentials, 403 when the account is inactive
 */
export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await comparePassword(password, user.password);
  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.status !== 'ACTIVE') {
    throw ApiError.forbidden('Your account is inactive, please contact your manager');
  }

  return {
    accessToken: signAccessToken(user),
    user: serializeUser(user),
    role: user.role,
  };
};

/**
 * Returns the current user's own profile.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 * @throws {ApiError} 404 when the user no longer exists
 */
export const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return serializeUser(user);
};
