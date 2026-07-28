/**
 * Leave service.
 *
 * Managers create leave records and approve or reject them; employees read
 * their own leave history.
 */
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { serializeLeave, serializeLeaves } from '../utils/serializers.js';
import { assertEmployeeExists } from './employee.service.js';

/** Nested employee returned with every leave record, minus salary. */
const leaveInclude = {
  employee: { select: { id: true, name: true, email: true, department: true } },
};

/**
 * Lists leave records with pagination and filters.
 *
 * @param {object} query Validated query params (`employeeId` scopes the result)
 */
export const listLeaves = async ({ page, limit, status, employeeId }) => {
  const where = {
    ...(status ? { status } : {}),
    ...(employeeId ? { employeeId } : {}),
  };

  const [total, leaves] = await Promise.all([
    prisma.leave.count({ where }),
    prisma.leave.findMany({
      where,
      include: leaveInclude,
      orderBy: [{ fromDate: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items: serializeLeaves(leaves), total, page, limit };
};

/**
 * Creates a leave record for an employee.
 *
 * @param {object} data Validated body
 */
export const createLeave = async (data) => {
  await assertEmployeeExists(data.employeeId);

  const leave = await prisma.leave.create({
    data,
    include: leaveInclude,
  });

  return serializeLeave(leave);
};

/**
 * Moves a leave record to APPROVED or REJECTED.
 *
 * A decision is final: re-deciding an already-decided request is rejected so a
 * second manager cannot silently overturn the first one's call.
 *
 * @param {string} id
 * @param {'APPROVED'|'REJECTED'} status
 * @throws {ApiError} 404 when missing, 409 when already decided
 */
const decideLeave = async (id, status) => {
  const leave = await prisma.leave.findUnique({ where: { id } });
  if (!leave) {
    throw ApiError.notFound('Leave record not found');
  }

  if (leave.status !== 'PENDING') {
    throw ApiError.conflict(
      `This leave request has already been ${leave.status.toLowerCase()}`,
    );
  }

  const updated = await prisma.leave.update({
    where: { id },
    data: { status },
    include: leaveInclude,
  });

  return serializeLeave(updated);
};

/** Approves a pending leave request. */
export const approveLeave = (id) => decideLeave(id, 'APPROVED');

/** Rejects a pending leave request. */
export const rejectLeave = (id) => decideLeave(id, 'REJECTED');

/**
 * Lists the leave records of one employee.
 *
 * @param {string} employeeId Taken from the session for `/me/leaves`
 * @param {object} query Validated query params
 */
export const listLeavesForEmployee = async (employeeId, { page, limit, status }) =>
  listLeaves({ page, limit, status, employeeId });
