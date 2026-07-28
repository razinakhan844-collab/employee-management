/**
 * Validation primitives shared across modules.
 */
import { z } from 'zod';

/** A UUID path parameter named `id`. */
export const idParamSchema = z.object({
  id: z.string().uuid('A valid id is required'),
});

/** A UUID referencing a user. */
export const uuidField = (label = 'id') =>
  z.string({ required_error: `${label} is required` }).uuid(`${label} must be a valid id`);

/**
 * A calendar date accepted as `YYYY-MM-DD` or a full ISO timestamp, normalized
 * to a `Date` at UTC midnight so `@db.Date` columns store the intended day
 * regardless of the caller's timezone.
 */
export const dateField = (label = 'date') =>
  z
    .string({ required_error: `${label} is required` })
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: `${label} must be a valid date`,
    })
    .transform((value) => {
      const parsed = new Date(value);
      return new Date(
        Date.UTC(
          parsed.getUTCFullYear(),
          parsed.getUTCMonth(),
          parsed.getUTCDate(),
        ),
      );
    });

/** A 24-hour clock time such as `09:00` or `17:30`. */
export const timeField = (label = 'time') =>
  z
    .string({ required_error: `${label} is required` })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, `${label} must be in HH:mm format`);

/**
 * Standard pagination + search query parameters.
 * Query strings are always text, so page/limit are coerced to numbers here.
 *
 * @param {object} [extras] Additional schema keys to merge in
 */
export const paginationSchema = (extras = {}) =>
  z.object({
    page: z.coerce.number().int().min(1, 'page must be 1 or greater').default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, 'limit must be 1 or greater')
      .max(100, 'limit cannot exceed 100')
      .default(10),
    ...extras,
  });
