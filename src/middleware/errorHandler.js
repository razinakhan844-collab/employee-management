/**
 * Centralized error handling.
 *
 * Every failure in the app — thrown, rejected, or routed to an unknown path —
 * ends up here and leaves as the same JSON envelope:
 *
 *   { success: false, message, errors?, stack? }
 *
 * Only `ApiError`s (and recognised Prisma/JSON errors) expose their message.
 * Anything else is an unexpected bug and is reported as a generic 500 so
 * internals never leak to clients.
 */
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import { isProduction } from '../config/env.js';

/** Handles requests that matched no route. */
export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

/**
 * Translates known Prisma errors into `ApiError`s.
 * Returns `null` when the error is not a recognised Prisma failure.
 */
const normalizePrismaError = (error) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      // Unique constraint violation — e.g. duplicate email.
      case 'P2002': {
        const target = error.meta?.target;
        const field = Array.isArray(target) ? target.join(', ') : (target ?? 'field');
        return ApiError.conflict(`A record with this ${field} already exists`);
      }
      // Foreign key constraint failed — e.g. assigning to a missing employee.
      case 'P2003':
        return ApiError.badRequest('Referenced record does not exist');
      // Record required by the operation was not found.
      case 'P2025':
        return ApiError.notFound(error.meta?.cause ?? 'Record not found');
      default:
        return null;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return ApiError.badRequest('Invalid data supplied to the database query');
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return ApiError.internal('Unable to connect to the database');
  }

  return null;
};

/**
 * Express error handler. Must keep all four parameters — Express identifies
 * error middleware by arity.
 *
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let error = err;

  // Malformed JSON body — express.json() raises a SyntaxError with `body` set.
  if (error instanceof SyntaxError && 'body' in error) {
    error = ApiError.badRequest('Request body contains invalid JSON');
  }

  if (!(error instanceof ApiError)) {
    error = normalizePrismaError(error) ?? error;
  }

  if (!(error instanceof ApiError)) {
    // Unexpected failure: log the real error server-side, return a generic one.
    // eslint-disable-next-line no-console
    console.error('[unhandled error]', err);
    error = ApiError.internal();
  }

  const body = {
    success: false,
    message: error.message,
  };

  if (error.details?.length) {
    body.errors = error.details;
  }

  // Stack traces are a debugging aid only — never sent in production.
  if (!isProduction && err instanceof Error) {
    body.stack = err.stack;
  }

  return res.status(error.statusCode || 500).json(body);
};
