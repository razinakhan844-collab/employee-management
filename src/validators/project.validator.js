/**
 * Validation schemas for the project module.
 */
import { z } from 'zod';
import { paginationSchema, uuidField } from './common.validator.js';

const PROJECT_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];

const nameField = z
  .string({ required_error: 'Project name is required' })
  .trim()
  .min(3, 'Project name must be at least 3 characters')
  .max(150, 'Project name cannot exceed 150 characters');

const descriptionField = z
  .string()
  .trim()
  .max(2000, 'Description cannot exceed 2000 characters');

const statusField = z.enum(PROJECT_STATUSES, {
  errorMap: () => ({
    message: 'Status must be NOT_STARTED, IN_PROGRESS, COMPLETED or ON_HOLD',
  }),
});

/** POST /projects */
export const createProjectSchema = z.object({
  name: nameField,
  description: descriptionField.optional(),
  employeeId: uuidField('employeeId'),
  status: statusField.default('NOT_STARTED'),
});

/** PUT /projects/:id */
export const updateProjectSchema = z
  .object({
    name: nameField.optional(),
    description: descriptionField.nullable().optional(),
    employeeId: uuidField('employeeId').optional(),
    status: statusField.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/** GET /projects */
export const listProjectsQuerySchema = paginationSchema({
  status: statusField.optional(),
  employeeId: uuidField('employeeId').optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

/** GET /me/projects */
export const listMyProjectsQuerySchema = paginationSchema({
  status: statusField.optional(),
});
