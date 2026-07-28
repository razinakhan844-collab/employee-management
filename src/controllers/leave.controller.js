/**
 * Leave controller.
 */
import * as leaveService from '../services/leave.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPaginationMeta, sendSuccess } from '../utils/apiResponse.js';

/**
 * GET /api/leaves
 * Manager only.
 */
export const listLeaves = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await leaveService.listLeaves(req.validatedQuery);

  return sendSuccess(res, {
    message: 'Leaves retrieved successfully',
    data: items,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

/**
 * POST /api/leaves
 * Manager only. Creates a leave record for an employee.
 */
export const createLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.createLeave(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Leave record created successfully',
    data: leave,
  });
});

/**
 * PATCH /api/leaves/:id/approve
 * Manager only.
 */
export const approveLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.approveLeave(req.params.id);

  return sendSuccess(res, {
    message: 'Leave approved successfully',
    data: leave,
  });
});

/**
 * PATCH /api/leaves/:id/reject
 * Manager only.
 */
export const rejectLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.rejectLeave(req.params.id);

  return sendSuccess(res, {
    message: 'Leave rejected successfully',
    data: leave,
  });
});

/**
 * GET /api/employees/:id/leaves
 * Manager only. Leave history of one employee, for the employee profile view.
 */
export const listEmployeeLeaves = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await leaveService.listLeavesForEmployee(
    req.params.id,
    req.validatedQuery,
  );

  return sendSuccess(res, {
    message: 'Leaves retrieved successfully',
    data: items,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

/**
 * GET /api/me/leaves
 * Any authenticated user — only their own leave records.
 */
export const listMyLeaves = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await leaveService.listLeavesForEmployee(
    req.user.id,
    req.validatedQuery,
  );

  return sendSuccess(res, {
    message: 'Leaves retrieved successfully',
    data: items,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});
