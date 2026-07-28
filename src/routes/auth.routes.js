/**
 * Authentication routes — mounted at /api/auth.
 * The only public routes in the application.
 */
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/auth.validator.js';

const router = Router();

// POST /api/auth/login — public
router.post('/login', validate({ body: loginSchema }), authController.login);

export default router;
