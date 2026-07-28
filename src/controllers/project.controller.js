/**
 * Project controller.
 */
import * as projectService from '../services/project.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPaginationMeta, sendSuccess } from '../utils/apiResponse.js';

/**
 * GET /api/projects
 * Manager only.
 */
export const listProjects = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await projectService.listProjects(
    req.validatedQuery,
  );

  return sendSuccess(res, {
    message: 'Projects retrieved successfully',
    data: items,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

/**
 * POST /api/projects
 * Manager only. Creates a project and assigns it to an employee.
 */
export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Project created successfully',
    data: project,
  });
});

/**
 * PUT /api/projects/:id
 * Manager only.
 */
export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body);

  return sendSuccess(res, {
    message: 'Project updated successfully',
    data: project,
  });
});

/**
 * DELETE /api/projects/:id
 * Manager only.
 */
export const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id);

  return sendSuccess(res, {
    message: 'Project deleted successfully',
  });
});

/**
 * GET /api/employees/:id/projects
 * Manager only. Projects of one employee, for the employee profile view.
 */
export const listEmployeeProjects = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await projectService.listProjectsForEmployee(
    req.params.id,
    req.validatedQuery,
  );

  return sendSuccess(res, {
    message: 'Projects retrieved successfully',
    data: items,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

/**
 * GET /api/me/projects
 * Any authenticated user — only their own projects.
 */
export const listMyProjects = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await projectService.listProjectsForEmployee(
    req.user.id,
    req.validatedQuery,
  );

  return sendSuccess(res, {
    message: 'Projects retrieved successfully',
    data: items,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});
