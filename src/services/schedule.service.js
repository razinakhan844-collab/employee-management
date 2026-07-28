/**
 * Schedule service.
 *
 * Managers create and edit schedule entries; employees read their own.
 */
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { serializeSchedule, serializeSchedules } from '../utils/serializers.js';
import { assertEmployeeExists } from './employee.service.js';

/** Nested employee returned with every schedule entry, minus salary. */
const scheduleInclude = {
  employee: { select: { id: true, name: true, email: true, department: true } },
};

/**
 * Builds the optional `date` range filter from `from` / `to`.
 * Either bound may be omitted.
 */
const buildDateFilter = (from, to) => {
  if (!from && !to) return {};
  return {
    date: {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    },
  };
};

/**
 * Lists schedule entries with pagination and an optional date window.
 *
 * @param {object} query Validated query params (`employeeId` scopes the result)
 */
export const listSchedules = async ({ page, limit, employeeId, from, to }) => {
  const where = {
    ...(employeeId ? { employeeId } : {}),
    ...buildDateFilter(from, to),
  };

  const [total, schedules] = await Promise.all([
    prisma.schedule.count({ where }),
    prisma.schedule.findMany({
      where,
      include: scheduleInclude,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items: serializeSchedules(schedules), total, page, limit };
};

/**
 * Creates a schedule entry for an employee.
 *
 * @param {object} data Validated body
 */
export const createSchedule = async (data) => {
  await assertEmployeeExists(data.employeeId);

  const schedule = await prisma.schedule.create({
    data,
    include: scheduleInclude,
  });

  return serializeSchedule(schedule);
};

/**
 * Updates a schedule entry.
 *
 * @param {string} id
 * @param {object} data Validated body
 * @throws {ApiError} 404 when missing, 422 when the merged times are invalid
 */
export const updateSchedule = async (id, data) => {
  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) {
    throw ApiError.notFound('Schedule not found');
  }

  if (data.employeeId && data.employeeId !== schedule.employeeId) {
    await assertEmployeeExists(data.employeeId);
  }

  // The validator can only compare times when both are in the body. For partial
  // updates the missing side is filled in from the stored record and re-checked.
  const startTime = data.startTime ?? schedule.startTime;
  const endTime = data.endTime ?? schedule.endTime;
  if (endTime <= startTime) {
    throw ApiError.unprocessable('Validation failed', [
      { field: 'endTime', message: 'endTime must be later than startTime' },
    ]);
  }

  const updated = await prisma.schedule.update({
    where: { id },
    data,
    include: scheduleInclude,
  });

  return serializeSchedule(updated);
};

/**
 * Deletes a schedule entry.
 *
 * @param {string} id
 * @throws {ApiError} 404 when not found
 */
export const deleteSchedule = async (id) => {
  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) {
    throw ApiError.notFound('Schedule not found');
  }

  await prisma.schedule.delete({ where: { id } });
};

/**
 * Lists the schedule entries of one employee.
 *
 * @param {string} employeeId Taken from the session for `/me/schedules`
 * @param {object} query Validated query params
 */
export const listSchedulesForEmployee = async (employeeId, { page, limit, from, to }) =>
  listSchedules({ page, limit, employeeId, from, to });
