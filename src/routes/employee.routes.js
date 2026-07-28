/**
 * Employee routes — mounted at /api/employees.
 *
 * Every route in this file is MANAGER-only. Authentication is applied once at
 * the top so no individual route can accidentally be left unprotected.
 */
import { Router } from 'express';
import * as employeeController from '../controllers/employee.controller.js';
import * as taskController from '../controllers/task.controller.js';
import * as projectController from '../controllers/project.controller.js';
import * as scheduleController from '../controllers/schedule.controller.js';
import * as leaveController from '../controllers/leave.controller.js';
import { authenticateUser } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
  updateSalarySchema,
} from '../validators/employee.validator.js';
import { listMyTasksQuerySchema } from '../validators/task.validator.js';
import { listMyProjectsQuerySchema } from '../validators/project.validator.js';
import { listMySchedulesQuerySchema } from '../validators/schedule.validator.js';
import { listMyLeavesQuerySchema } from '../validators/leave.validator.js';

const router = Router();

// Applies to every route below.
router.use(authenticateUser, authorizeRoles('MANAGER'));

// GET /api/employees — paginated list
router.get(
  '/',
  validate({ query: listEmployeesQuerySchema }),
  employeeController.listEmployees,
);

// POST /api/employees — add a new employee
router.post('/', validate({ body: createEmployeeSchema }), employeeController.createEmployee);

// GET /api/employees/:id — employee profile
router.get('/:id', validate({ params: idParamSchema }), employeeController.getEmployee);

// PUT /api/employees/:id — update details
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateEmployeeSchema }),
  employeeController.updateEmployee,
);

// DELETE /api/employees/:id
router.delete('/:id', validate({ params: idParamSchema }), employeeController.deleteEmployee);

// GET /api/employees/:id/salary
router.get(
  '/:id/salary',
  validate({ params: idParamSchema }),
  employeeController.getEmployeeSalary,
);

// PATCH /api/employees/:id/salary — set or update salary
router.patch(
  '/:id/salary',
  validate({ params: idParamSchema, body: updateSalarySchema }),
  employeeController.updateSalary,
);

/*
 * Per-employee tabs on the manager's employee-profile screen. These mirror the
 * `/me/*` employee endpoints but are scoped by `:id` instead of the session.
 */

// GET /api/employees/:id/tasks
router.get(
  '/:id/tasks',
  validate({ params: idParamSchema, query: listMyTasksQuerySchema }),
  taskController.listEmployeeTasks,
);

// GET /api/employees/:id/projects
router.get(
  '/:id/projects',
  validate({ params: idParamSchema, query: listMyProjectsQuerySchema }),
  projectController.listEmployeeProjects,
);

// GET /api/employees/:id/schedules
router.get(
  '/:id/schedules',
  validate({ params: idParamSchema, query: listMySchedulesQuerySchema }),
  scheduleController.listEmployeeSchedules,
);

// GET /api/employees/:id/leaves
router.get(
  '/:id/leaves',
  validate({ params: idParamSchema, query: listMyLeavesQuerySchema }),
  leaveController.listEmployeeLeaves,
);

export default router;
