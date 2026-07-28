/**
 * Authentication controller.
 * Controllers stay thin: they translate HTTP into service calls and back.
 */
import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * POST /api/auth/login
 * Public. Returns the access token, the user and their role.
 */
export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  return sendSuccess(res, {
    message: 'Logged in successfully',
    data: result,
  });
});

/**
 * GET /api/me
 * Any authenticated user — returns their own profile.
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);

  return sendSuccess(res, {
    message: 'Profile retrieved successfully',
    data: user,
  });
});
