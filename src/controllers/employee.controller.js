/**
 * Employee controller. Every handler here is manager-only except `getMySalary`.
 */
import * as employeeService from '../services/employee.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPaginationMeta, sendSuccess } from '../utils/apiResponse.js';

/**
 * GET /api/employees
 * Manager only. Paginated, searchable and filterable list.
 */
export const listEmployees = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await employeeService.listEmployees(
    req.validatedQuery,
  );

  return sendSuccess(res, {
    message: 'Employees retrieved successfully',
    data: items,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

/**
 * GET /api/employees/:id
 * Manager only.
 */
export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.id);

  return sendSuccess(res, {
    message: 'Employee retrieved successfully',
    data: employee,
  });
});

/**
 * POST /api/employees
 * Manager only.
 */
export const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.createEmployee(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Employee created successfully',
    data: employee,
  });
});

/**
 * PUT /api/employees/:id
 * Manager only.
 */
export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee(req.params.id, req.body);

  return sendSuccess(res, {
    message: 'Employee updated successfully',
    data: employee,
  });
});

/**
 * DELETE /api/employees/:id
 * Manager only.
 */
export const deleteEmployee = asyncHandler(async (req, res) => {
  await employeeService.deleteEmployee(req.params.id, req.user.id);

  return sendSuccess(res, {
    message: 'Employee deleted successfully',
  });
});

/**
 * PATCH /api/employees/:id/salary
 * Manager only. Sets or updates the employee's salary.
 */
export const updateSalary = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateSalary(req.params.id, req.body.salary);

  return sendSuccess(res, {
    message: 'Salary updated successfully',
    data: employee,
  });
});

/**
 * GET /api/employees/:id/salary
 * Manager only. Salary card for a given employee.
 */
export const getEmployeeSalary = asyncHandler(async (req, res) => {
  const salary = await employeeService.getSalary(req.params.id);

  return sendSuccess(res, {
    message: 'Salary retrieved successfully',
    data: salary,
  });
});

/**
 * GET /api/me/salary
 * Any authenticated user — their own salary only.
 */
export const getMySalary = asyncHandler(async (req, res) => {
  const salary = await employeeService.getSalary(req.user.id);

  return sendSuccess(res, {
    message: 'Salary retrieved successfully',
    data: salary,
  });
});
