/**
 * Operational error carrying an HTTP status code.
 *
 * Anything thrown as an `ApiError` is considered expected/handled and is
 * reported to the client verbatim. Every other thrown value is treated as an
 * unexpected bug and reduced to a generic 500 by the error handler.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status code
   * @param {string} message Human-readable message safe to expose to clients
   * @param {Array<{field: string, message: string}>} [details] Field-level errors
   */
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }

  static unprocessable(message = 'Validation failed', details) {
    return new ApiError(422, message, details);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}
