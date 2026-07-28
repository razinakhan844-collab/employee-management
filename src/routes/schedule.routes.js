/**
 * Schedule routes — mounted at /api/schedules. Manager-only.
 * Employees read their schedule through /api/me/schedules.
 */
import { Router } from 'express';
import * as scheduleController from '../controllers/schedule.controller.js';
import { authenticateUser } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  createScheduleSchema,
  listSchedulesQuerySchema,
  updateScheduleSchema,
} from '../validators/schedule.validator.js';

const router = Router();

router.use(authenticateUser, authorizeRoles('MANAGER'));

// GET /api/schedules
router.get(
  '/',
  validate({ query: listSchedulesQuerySchema }),
  scheduleController.listSchedules,
);

// POST /api/schedules
router.post(
  '/',
  validate({ body: createScheduleSchema }),
  scheduleController.createSchedule,
);

// PUT /api/schedules/:id
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateScheduleSchema }),
  scheduleController.updateSchedule,
);

// DELETE /api/schedules/:id
router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  scheduleController.deleteSchedule,
);

export default router;
