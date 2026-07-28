/**
 * Validation schemas for the employee module.
 */
import { z } from 'zod';
import { paginationSchema } from './common.validator.js';

const ROLES = ['MANAGER', 'EMPLOYEE'];
const STATUSES = ['ACTIVE', 'INACTIVE'];

const nameField = z
  .string({ required_error: 'Name is required' })
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name cannot exceed 100 characters');

const emailField = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('A valid email address is required');

const passwordField = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password cannot exceed 72 characters') // bcrypt truncates beyond 72 bytes
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

const departmentField = z
  .string()
  .trim()
  .min(2, 'Department must be at least 2 characters')
  .max(100, 'Department cannot exceed 100 characters');

const salaryField = z
  .number({ invalid_type_error: 'Salary must be a number' })
  .nonnegative('Salary cannot be negative')
  .max(99_999_999.99, 'Salary exceeds the maximum allowed value');

/** POST /employees */
export const createEmployeeSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  role: z.enum(ROLES, { errorMap: () => ({ message: 'Role must be MANAGER or EMPLOYEE' }) })
    .default('EMPLOYEE'),
  department: departmentField.optional(),
  salary: salaryField.optional(),
  status: z
    .enum(STATUSES, { errorMap: () => ({ message: 'Status must be ACTIVE or INACTIVE' }) })
    .default('ACTIVE'),
});

/**
 * PUT /employees/:id
 * Every field is optional, but the body must contain at least one of them —
 * an empty update is almost always a client bug.
 */
export const updateEmployeeSchema = z
  .object({
    name: nameField.optional(),
    email: emailField.optional(),
    password: passwordField.optional(),
    role: z
      .enum(ROLES, { errorMap: () => ({ message: 'Role must be MANAGER or EMPLOYEE' }) })
      .optional(),
    department: departmentField.nullable().optional(),
    salary: salaryField.nullable().optional(),
    status: z
      .enum(STATUSES, { errorMap: () => ({ message: 'Status must be ACTIVE or INACTIVE' }) })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/** PATCH /employees/:id/salary */
export const updateSalarySchema = z.object({
  salary: salaryField,
});

/** GET /employees — pagination, search and filters. */
export const listEmployeesQuerySchema = paginationSchema({
  /** Case-insensitive partial match against name or email. */
  search: z.string().trim().min(1).max(100).optional(),
  department: z.string().trim().min(1).max(100).optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(STATUSES).optional(),
  sortBy: z.enum(['name', 'email', 'department', 'salary', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
