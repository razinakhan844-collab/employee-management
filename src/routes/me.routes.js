/**
 * Self-service routes — mounted at /api/me.
 *
 * Open to both roles, but every handler resolves its data from `req.user.id`,
 * so a user can only ever read their own records. There is no path here that
 * accepts an employee id from the client.
 */
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as employeeController from '../controllers/employee.controller.js';
import * as taskController from '../controllers/task.controller.js';
import * as projectController from '../controllers/project.controller.js';
import * as scheduleController from '../controllers/schedule.controller.js';
import * as leaveController from '../controllers/leave.controller.js';
import { authenticateUser } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { listMyTasksQuerySchema } from '../validators/task.validator.js';
import { listMyProjectsQuerySchema } from '../validators/project.validator.js';
import { listMySchedulesQuerySchema } from '../validators/schedule.validator.js';
import { listMyLeavesQuerySchema } from '../validators/leave.validator.js';

const router = Router();

// Applies to every route below.
router.use(authenticateUser, authorizeRoles('MANAGER', 'EMPLOYEE'));

// GET /api/me — own profile
router.get('/', authController.getMe);

// GET /api/me/salary — own salary
router.get('/salary', employeeController.getMySalary);

// GET /api/me/tasks — tasks assigned to me
router.get(
  '/tasks',
  validate({ query: listMyTasksQuerySchema }),
  taskController.listMyTasks,
);

// GET /api/me/projects — projects assigned to me
router.get(
  '/projects',
  validate({ query: listMyProjectsQuerySchema }),
  projectController.listMyProjects,
);

// GET /api/me/schedules — my schedule
router.get(
  '/schedules',
  validate({ query: listMySchedulesQuerySchema }),
  scheduleController.listMySchedules,
);

// GET /api/me/leaves — my leave records
router.get(
  '/leaves',
  validate({ query: listMyLeavesQuerySchema }),
  leaveController.listMyLeaves,
);

export default router;
