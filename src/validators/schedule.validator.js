/**
 * Validation schemas for the schedule module.
 */
import { z } from 'zod';
import { dateField, paginationSchema, timeField, uuidField } from './common.validator.js';

const descriptionField = z
  .string()
  .trim()
  .max(500, 'Description cannot exceed 500 characters');

/** `endTime` must come after `startTime`; both are plain "HH:mm" strings. */
const endAfterStart = (data) => {
  if (!data.startTime || !data.endTime) return true;
  return data.endTime > data.startTime;
};

const endAfterStartMessage = {
  message: 'endTime must be later than startTime',
  path: ['endTime'],
};

/** POST /schedules */
export const createScheduleSchema = z
  .object({
    employeeId: uuidField('employeeId'),
    date: dateField('date'),
    startTime: timeField('startTime'),
    endTime: timeField('endTime'),
    description: descriptionField.optional(),
  })
  .refine(endAfterStart, endAfterStartMessage);

/**
 * PUT /schedules/:id
 *
 * The time comparison only runs when both times are present in the body;
 * partial time updates are re-checked against the stored record in the service
 * layer, where the existing values are known.
 */
export const updateScheduleSchema = z
  .object({
    employeeId: uuidField('employeeId').optional(),
    date: dateField('date').optional(),
    startTime: timeField('startTime').optional(),
    endTime: timeField('endTime').optional(),
    description: descriptionField.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })
  .refine(endAfterStart, endAfterStartMessage);

/** GET /schedules — supports an optional date window. */
export const listSchedulesQuerySchema = paginationSchema({
  employeeId: uuidField('employeeId').optional(),
  from: dateField('from').optional(),
  to: dateField('to').optional(),
});

/** GET /me/schedules */
export const listMySchedulesQuerySchema = paginationSchema({
  from: dateField('from').optional(),
  to: dateField('to').optional(),
});
