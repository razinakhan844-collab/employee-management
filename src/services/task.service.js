/**
 * Task service.
 *
 * Managers create, update and delete tasks; employees can only read the tasks
 * assigned to them. The employee-scoped reads take the employee id from the
 * authenticated session, never from client input.
 */
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { serializeTask, serializeTasks } from '../utils/serializers.js';
import { assertEmployeeExists } from './employee.service.js';

/** Nested relations returned with every task, minus salary fields. */
const taskInclude = {
  assignee: { select: { id: true, name: true, email: true, department: true } },
  assigner: { select: { id: true, name: true, email: true } },
};

/**
 * Lists tasks with pagination and filters.
 *
 * @param {object} query Validated query params (`assignedTo` scopes the result)
 */
export const listTasks = async ({ page, limit, status, assignedTo, search }) => {
  const where = {
    ...(status ? { status } : {}),
    ...(assignedTo ? { assignedTo } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      include: taskInclude,
      // Undated tasks sort last so upcoming deadlines surface first.
      orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items: serializeTasks(tasks), total, page, limit };
};

/**
 * Creates a task and assigns it to an employee.
 *
 * @param {object} data Validated body
 * @param {string} assignedBy Id of the manager creating the task
 */
export const createTask = async (data, assignedBy) => {
  await assertEmployeeExists(data.assignedTo);

  const task = await prisma.task.create({
    data: { ...data, assignedBy },
    include: taskInclude,
  });

  return serializeTask(task);
};

/**
 * Updates a task.
 *
 * @param {string} id
 * @param {object} data Validated body
 * @throws {ApiError} 404 when the task or the new assignee is missing
 */
export const updateTask = async (id, data) => {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  if (data.assignedTo && data.assignedTo !== task.assignedTo) {
    await assertEmployeeExists(data.assignedTo);
  }

  const updated = await prisma.task.update({
    where: { id },
    data,
    include: taskInclude,
  });

  return serializeTask(updated);
};

/**
 * Deletes a task.
 *
 * @param {string} id
 * @throws {ApiError} 404 when not found
 */
export const deleteTask = async (id) => {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  await prisma.task.delete({ where: { id } });
};

/**
 * Lists the tasks assigned to one employee.
 *
 * @param {string} employeeId Taken from the session for `/me/tasks`
 * @param {object} query Validated query params
 */
export const listTasksForEmployee = async (employeeId, { page, limit, status }) =>
  listTasks({ page, limit, status, assignedTo: employeeId });
