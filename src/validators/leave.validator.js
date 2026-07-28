/**
 * Validation schemas for the leave module.
 */
import { z } from 'zod';
import { dateField, paginationSchema, uuidField } from './common.validator.js';

const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

const reasonField = z
  .string({ required_error: 'Reason is required' })
  .trim()
  .min(3, 'Reason must be at least 3 characters')
  .max(500, 'Reason cannot exceed 500 characters');

const statusField = z.enum(LEAVE_STATUSES, {
  errorMap: () => ({ message: 'Status must be PENDING, APPROVED or REJECTED' }),
});

/** `toDate` may equal `fromDate` (a single-day leave) but never precede it. */
const validRange = (data) => {
  if (!data.fromDate || !data.toDate) return true;
  return data.toDate.getTime() >= data.fromDate.getTime();
};

const validRangeMessage = {
  message: 'toDate cannot be earlier than fromDate',
  path: ['toDate'],
};

/** POST /leaves */
export const createLeaveSchema = z
  .object({
    employeeId: uuidField('employeeId'),
    fromDate: dateField('fromDate'),
    toDate: dateField('toDate'),
    reason: reasonField,
    status: statusField.default('PENDING'),
  })
  .refine(validRange, validRangeMessage);

/** GET /leaves */
export const listLeavesQuerySchema = paginationSchema({
  status: statusField.optional(),
  employeeId: uuidField('employeeId').optional(),
});

/** GET /me/leaves */
export const listMyLeavesQuerySchema = paginationSchema({
  status: statusField.optional(),
});
