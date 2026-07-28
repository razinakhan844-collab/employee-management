/**
 * Leave routes — mounted at /api/leaves. Manager-only.
 * Employees read their leave records through /api/me/leaves.
 */
import { Router } from 'express';
import * as leaveController from '../controllers/leave.controller.js';
import { authenticateUser } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../validators/common.validator.js';
import { createLeaveSchema, listLeavesQuerySchema } from '../validators/leave.validator.js';

const router = Router();

router.use(authenticateUser, authorizeRoles('MANAGER'));

// GET /api/leaves
router.get('/', validate({ query: listLeavesQuerySchema }), leaveController.listLeaves);

// POST /api/leaves — create a leave record for an employee
router.post('/', validate({ body: createLeaveSchema }), leaveController.createLeave);

// PATCH /api/leaves/:id/approve
router.patch(
  '/:id/approve',
  validate({ params: idParamSchema }),
  leaveController.approveLeave,
);

// PATCH /api/leaves/:id/reject
router.patch(
  '/:id/reject',
  validate({ params: idParamSchema }),
  leaveController.rejectLeave,
);

export default router;
