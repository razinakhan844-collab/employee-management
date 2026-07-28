/**
 * Wraps an async route handler so a rejected promise is forwarded to Express'
 * error handling chain instead of crashing the process with an unhandled
 * rejection. Lets controllers use plain `async/await` with no try/catch.
 *
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<unknown>} fn
 * @returns {import('express').RequestHandler}
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
