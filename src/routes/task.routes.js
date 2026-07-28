/**
 * Task routes — mounted at /api/tasks. Manager-only.
 * Employees read their tasks through /api/me/tasks.
 */
import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import { authenticateUser } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from '../validators/task.validator.js';

const router = Router();

router.use(authenticateUser, authorizeRoles('MANAGER'));

// GET /api/tasks
router.get('/', validate({ query: listTasksQuerySchema }), taskController.listTasks);

// POST /api/tasks — create and assign
router.post('/', validate({ body: createTaskSchema }), taskController.createTask);

// PUT /api/tasks/:id
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateTaskSchema }),
  taskController.updateTask,
);

// DELETE /api/tasks/:id
router.delete('/:id', validate({ params: idParamSchema }), taskController.deleteTask);

export default router;
