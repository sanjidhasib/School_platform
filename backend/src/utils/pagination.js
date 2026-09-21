/**
 * Parse pagination + sort params from request query with safe defaults.
 */
const getPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Resolve pagination params from raw query values (or an express req).
 * Returns { page, limit, skip }.
 */
const paginate = (reqOrNull, opts = {}) => {
  const page = Math.max(parseInt(opts.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(opts.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const paginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
});

/**
 * Wrap a list of items with pagination metadata, matching the controller
 * contract that consumed by the frontend api client.
 */
const paginateResponse = (items, total, page, limit) => {
  const data = Array.isArray(items) ? items : [];
  return {
    data,
    pagination: paginationMeta(total, page, limit),
  };
};

const getSort = (req, defaultSort = "-createdAt") => {
  const sort = req.query.sort || defaultSort;
  return sort;
};

module.exports = { getPagination, paginate, paginationMeta, paginateResponse, getSort };
