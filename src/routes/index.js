/**
 * Root API router — every module is mounted here under /api.
 */
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import meRoutes from './me.routes.js';
import employeeRoutes from './employee.routes.js';
import taskRoutes from './task.routes.js';
import projectRoutes from './project.routes.js';
import scheduleRoutes from './schedule.routes.js';
import leaveRoutes from './leave.routes.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

/** Liveness probe — public, used by load balancers and uptime checks. */
router.get('/health', (_req, res) =>
  sendSuccess(res, {
    message: 'API is healthy',
    data: { uptime: process.uptime() },
  }),
);

router.use('/auth', authRoutes); // public
router.use('/me', meRoutes); // MANAGER + EMPLOYEE (own data only)
router.use('/employees', employeeRoutes); // MANAGER only
router.use('/tasks', taskRoutes); // MANAGER only
router.use('/projects', projectRoutes); // MANAGER only
router.use('/schedules', scheduleRoutes); // MANAGER only
router.use('/leaves', leaveRoutes); // MANAGER only

export default router;
