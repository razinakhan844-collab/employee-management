/**
 * JWT authentication middleware.
 *
 * Extracts and verifies the bearer token, then re-loads the user from the
 * database. Re-loading (rather than trusting the token payload) means a
 * deactivated or deleted user loses access immediately, without waiting for
 * their token to expire.
 */
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/jwt.js';

/** Pulls the raw token out of an `Authorization: Bearer <token>` header. */
const extractToken = (req) => {
  const header = req.headers.authorization;
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (!/^Bearer$/i.test(scheme) || !token) return null;

  return token.trim();
};

/**
 * Populates `req.user` with the authenticated user, or throws 401.
 * @type {import('express').RequestHandler}
 */
export const authenticateUser = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    throw ApiError.unauthorized('Authentication token is missing');
  }

  const payload = verifyAccessToken(token);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      status: true,
    },
  });

  if (!user) {
    throw ApiError.unauthorized('The user for this token no longer exists');
  }

  if (user.status !== 'ACTIVE') {
    throw ApiError.forbidden('Your account is inactive, please contact your manager');
  }

  req.user = user;
  next();
});
