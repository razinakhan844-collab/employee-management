/**
 * Schedule controller.
 */
import * as scheduleService from '../services/schedule.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPaginationMeta, sendSuccess } from '../utils/apiResponse.js';

/**
 * GET /api/schedules
 * Manager only.
 */
export const listSchedules = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await scheduleService.listSchedules(
    req.validatedQuery,
  );

  return sendSuccess(res, {
    message: 'Schedules retrieved successfully',
    data: items,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

/**
 * POST /api/schedules
 * Manager only.
 */
export const createSchedule = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.createSchedule(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Schedule created successfully',
    data: schedule,
  });
});

/**
 * PUT /api/schedules/:id
 * Manager only.
 */
export const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.updateSchedule(req.params.id, req.body);

  return sendSuccess(res, {
    message: 'Schedule updated successfully',
    data: schedule,
  });
});

/**
 * DELETE /api/schedules/:id
 * Manager only.
 */
export const deleteSchedule = asyncHandler(async (req, res) => {
  await scheduleService.deleteSchedule(req.params.id);

  return sendSuccess(res, {
    message: 'Schedule deleted successfully',
  });
});

/**
 * GET /api/employees/:id/schedules
 * Manager only. Schedule of one employee, for the employee profile view.
 */
export const listEmployeeSchedules = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await scheduleService.listSchedulesForEmployee(
    req.params.id,
    req.validatedQuery,
  );

  return sendSuccess(res, {
    message: 'Schedules retrieved successfully',
    data: items,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

/**
 * GET /api/me/schedules
 * Any authenticated user — only their own schedule.
 */
export const listMySchedules = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await scheduleService.listSchedulesForEmployee(
    req.user.id,
    req.validatedQuery,
  );

  return sendSuccess(res, {
    message: 'Schedules retrieved successfully',
    data: items,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});
