/**
 * Task controller.
 */
import * as taskService from '../services/task.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPaginationMeta, sendSuccess } from '../utils/apiResponse.js';

/**
 * GET /api/tasks
 * Manager only. All tasks, filterable by status/assignee.
 */
export const listTasks = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await taskService.listTasks(req.validatedQuery);

  return sendSuccess(res, {
    message: 'Tasks retrieved successfully',
    data: items,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

/**
 * POST /api/tasks
 * Manager only. `assignedBy` is taken from the session, never the body.
 */
export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.body, req.user.id);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Task created successfully',
    data: task,
  });
});

/**
 * PUT /api/tasks/:id
 * Manager only.
 */
export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.body);

  return sendSuccess(res, {
    message: 'Task updated successfully',
    data: task,
  });
});

/**
 * DELETE /api/tasks/:id
 * Manager only.
 */
export const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id);

  return sendSuccess(res, {
    message: 'Task deleted successfully',
  });
});

/**
 * GET /api/employees/:id/tasks
 * Manager only. Tasks of one employee, for the employee profile view.
 */
export const listEmployeeTasks = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await taskService.listTasksForEmployee(
    req.params.id,
    req.validatedQuery,
  );

  return sendSuccess(res, {
    message: 'Tasks retrieved successfully',
    data: items,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

/**
 * GET /api/me/tasks
 * Any authenticated user — only their own assigned tasks.
 */
export const listMyTasks = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await taskService.listTasksForEmployee(
    req.user.id,
    req.validatedQuery,
  );

  return sendSuccess(res, {
    message: 'Tasks retrieved successfully',
    data: items,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});
