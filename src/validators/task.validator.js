/**
 * Validation schemas for the task module.
 */
import { z } from 'zod';
import { dateField, paginationSchema, uuidField } from './common.validator.js';

const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

const titleField = z
  .string({ required_error: 'Title is required' })
  .trim()
  .min(3, 'Title must be at least 3 characters')
  .max(150, 'Title cannot exceed 150 characters');

const descriptionField = z
  .string()
  .trim()
  .max(2000, 'Description cannot exceed 2000 characters');

const statusField = z.enum(TASK_STATUSES, {
  errorMap: () => ({ message: 'Status must be PENDING, IN_PROGRESS or COMPLETED' }),
});

/** POST /tasks — `assignedBy` comes from the authenticated manager, not the body. */
export const createTaskSchema = z.object({
  title: titleField,
  description: descriptionField.optional(),
  assignedTo: uuidField('assignedTo'),
  dueDate: dateField('dueDate').optional(),
  status: statusField.default('PENDING'),
});

/** PUT /tasks/:id */
export const updateTaskSchema = z
  .object({
    title: titleField.optional(),
    description: descriptionField.nullable().optional(),
    assignedTo: uuidField('assignedTo').optional(),
    dueDate: dateField('dueDate').nullable().optional(),
    status: statusField.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/** GET /tasks */
export const listTasksQuerySchema = paginationSchema({
  status: statusField.optional(),
  assignedTo: uuidField('assignedTo').optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

/** GET /me/tasks — employees cannot filter by another employee. */
export const listMyTasksQuerySchema = paginationSchema({
  status: statusField.optional(),
});
