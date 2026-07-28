/**
 * Employee service — CRUD over users, plus salary management.
 * All operations here are manager-only; the routes enforce that.
 */
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword } from '../utils/password.js';
import { serializeUser, serializeUsers } from '../utils/serializers.js';

/**
 * Lists employees with pagination, search and filters.
 *
 * @param {object} query Validated query params
 * @returns {Promise<{items: object[], total: number, page: number, limit: number}>}
 */
export const listEmployees = async ({
  page,
  limit,
  search,
  department,
  role,
  status,
  sortBy,
  sortOrder,
}) => {
  const where = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(department ? { department: { equals: department, mode: 'insensitive' } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  // Count and page are fetched together so the total always matches the filter.
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items: serializeUsers(users), total, page, limit };
};

/**
 * Fetches a single employee by id.
 *
 * @param {string} id
 * @returns {Promise<object>}
 * @throws {ApiError} 404 when not found
 */
export const getEmployeeById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw ApiError.notFound('Employee not found');
  }

  return serializeUser(user);
};

/**
 * Creates an employee (or another manager).
 *
 * @param {object} data Validated body
 * @returns {Promise<object>} The created user, without its password
 * @throws {ApiError} 409 when the email is taken
 */
export const createEmployee = async (data) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await prisma.user.create({
    data: {
      ...data,
      password: await hashPassword(data.password),
    },
  });

  return serializeUser(user);
};

/**
 * Updates an employee's details.
 *
 * @param {string} id
 * @param {object} data Validated body — any subset of the editable fields
 * @returns {Promise<object>}
 * @throws {ApiError} 404 when not found, 409 when the new email is taken
 */
export const updateEmployee = async (id, data) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw ApiError.notFound('Employee not found');
  }

  // Reject a duplicate email early, so the client gets a clear 409 rather than
  // a raw constraint violation.
  if (data.email && data.email !== user.email) {
    const emailOwner = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailOwner) {
      throw ApiError.conflict('An account with this email already exists');
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...data,
      // Only re-hash when a new password was actually supplied.
      ...(data.password ? { password: await hashPassword(data.password) } : {}),
    },
  });

  return serializeUser(updated);
};

/**
 * Deletes an employee. Related tasks, projects, schedules and leaves cascade.
 *
 * @param {string} id Employee to delete
 * @param {string} requesterId Manager performing the deletion
 * @throws {ApiError} 404 when not found, 400 when deleting yourself
 */
export const deleteEmployee = async (id, requesterId) => {
  // Self-deletion would lock the manager out of their own account mid-session.
  if (id === requesterId) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw ApiError.notFound('Employee not found');
  }

  await prisma.user.delete({ where: { id } });
};

/**
 * Sets or updates an employee's salary.
 *
 * @param {string} id
 * @param {number} salary
 * @returns {Promise<object>}
 * @throws {ApiError} 404 when not found
 */
export const updateSalary = async (id, salary) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw ApiError.notFound('Employee not found');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { salary },
  });

  return serializeUser(updated);
};

/**
 * Returns just the salary information for a user — backs the salary card on
 * both dashboards.
 *
 * @param {string} id
 * @returns {Promise<{id: string, name: string, department: string|null, salary: number|null}>}
 * @throws {ApiError} 404 when not found
 */
export const getSalary = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, department: true, salary: true },
  });

  if (!user) {
    throw ApiError.notFound('Employee not found');
  }

  return { ...user, salary: user.salary === null ? null : Number(user.salary) };
};

/**
 * Asserts that a user exists and is an employee-assignable account.
 * Shared by the task, project, schedule and leave services so every "assign to
 * X" path fails the same way when X is missing.
 *
 * @param {string} employeeId
 * @throws {ApiError} 404 when the user does not exist
 */
export const assertEmployeeExists = async (employeeId) => {
  const user = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });

  if (!user) {
    throw ApiError.notFound('Employee not found');
  }
};
