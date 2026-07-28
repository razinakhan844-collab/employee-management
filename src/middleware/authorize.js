/**
 * Role-based authorization middleware.
 *
 * Usage:
 *   router.get('/employees', authenticateUser, authorizeRoles('MANAGER'), handler)
 *   router.get('/me', authenticateUser, authorizeRoles('MANAGER', 'EMPLOYEE'), handler)
 *
 * Must always run after `authenticateUser`, which populates `req.user`.
 */
import { ApiError } from '../utils/ApiError.js';

/**
 * Builds a middleware allowing only the given roles through.
 *
 * @param {...('MANAGER'|'EMPLOYEE')} allowedRoles
 * @returns {import('express').RequestHandler}
 */
export const authorizeRoles =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user) {
      // Programmer error: the route forgot `authenticateUser`.
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden('You do not have permission to access this resource'),
      );
    }

    return next();
  };
