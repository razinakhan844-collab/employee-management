/**
 * Request validation middleware built on Zod.
 *
 * A validator describes any of `body`, `params` and `query`. Each part present
 * in the schema is parsed and the *parsed* result is written back onto the
 * request, so controllers receive coerced, stripped, trusted data — unknown
 * keys never reach the database layer.
 */
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

/** Flattens a ZodError into `[{ field, message }]` for the response envelope. */
const formatIssues = (error) =>
  error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));

/**
 * Builds a validation middleware from a schema map.
 *
 * @param {{body?: import('zod').ZodTypeAny, params?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny}} schemas
 * @returns {import('express').RequestHandler}
 */
export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.query) req.validatedQuery = schemas.query.parse(req.query);
    if (schemas.body) req.body = schemas.body.parse(req.body);
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(ApiError.unprocessable('Validation failed', formatIssues(error)));
    }
    return next(error);
  }
};
