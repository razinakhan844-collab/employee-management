/**
 * Project service.
 *
 * Managers own the full lifecycle; employees can only read the projects
 * assigned to them.
 */
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { serializeProject, serializeProjects } from '../utils/serializers.js';
import { assertEmployeeExists } from './employee.service.js';

/** Nested employee returned with every project, minus salary. */
const projectInclude = {
  employee: { select: { id: true, name: true, email: true, department: true } },
};

/**
 * Lists projects with pagination and filters.
 *
 * @param {object} query Validated query params (`employeeId` scopes the result)
 */
export const listProjects = async ({ page, limit, status, employeeId, search }) => {
  const where = {
    ...(status ? { status } : {}),
    ...(employeeId ? { employeeId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items: serializeProjects(projects), total, page, limit };
};

/**
 * Creates a project and assigns it to an employee.
 *
 * @param {object} data Validated body
 */
export const createProject = async (data) => {
  await assertEmployeeExists(data.employeeId);

  const project = await prisma.project.create({
    data,
    include: projectInclude,
  });

  return serializeProject(project);
};

/**
 * Updates a project.
 *
 * @param {string} id
 * @param {object} data Validated body
 * @throws {ApiError} 404 when the project or the new assignee is missing
 */
export const updateProject = async (id, data) => {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  if (data.employeeId && data.employeeId !== project.employeeId) {
    await assertEmployeeExists(data.employeeId);
  }

  const updated = await prisma.project.update({
    where: { id },
    data,
    include: projectInclude,
  });

  return serializeProject(updated);
};

/**
 * Deletes a project.
 *
 * @param {string} id
 * @throws {ApiError} 404 when not found
 */
export const deleteProject = async (id) => {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  await prisma.project.delete({ where: { id } });
};

/**
 * Lists the projects assigned to one employee.
 *
 * @param {string} employeeId Taken from the session for `/me/projects`
 * @param {object} query Validated query params
 */
export const listProjectsForEmployee = async (employeeId, { page, limit, status }) =>
  listProjects({ page, limit, status, employeeId });
