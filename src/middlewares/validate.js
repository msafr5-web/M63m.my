'use strict';

const AppError = require('../utils/AppError');

/**
 * Validates req[source] against a zod schema and replaces it with the parsed (coerced, stripped) value.
 * Responds 422 with per-field messages on failure.
 */
module.exports = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new AppError(422, 'البيانات المدخلة غير صحيحة', details));
  }
  if (source === 'query') {
    // req.query is a getter in Express; keep the parsed copy separately.
    req.validatedQuery = result.data;
  } else {
    req[source] = result.data;
  }
  return next();
};
