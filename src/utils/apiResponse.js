/**
 * Helpers producing the single response envelope used by every endpoint.
 *
 * Success: { success: true, message, data, meta? }
 * Failure: { success: false, message, errors? }  (see middleware/errorHandler.js)
 */

/**
 * Sends a successful JSON response.
 *
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number} [options.statusCode=200]
 * @param {string} [options.message='Success']
 * @param {*} [options.data=null] Payload
 * @param {object} [options.meta] Extra info such as pagination
 */
export const sendSuccess = (
  res,
  { statusCode = 200, message = 'Success', data = null, meta } = {},
) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Builds the pagination `meta` block from a page/limit/total triple.
 *
 * @param {{page: number, limit: number, total: number}} params
 */
export const buildPaginationMeta = ({ page, limit, total }) => {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};
