'use strict';

const { UniqueConstraintError, ValidationError, ForeignKeyConstraintError } = require('sequelize');
const AppError = require('../utils/AppError');
const env = require('../config/env');

function normalize(err) {
  if (err instanceof AppError) return err;
  if (err instanceof UniqueConstraintError) {
    const field = err.errors?.[0]?.path;
    return new AppError(409, 'هذه البيانات مسجلة مسبقاً', field ? [{ field, message: 'القيمة مستخدمة' }] : undefined);
  }
  if (err instanceof ValidationError) {
    return new AppError(422, 'البيانات المدخلة غير صحيحة', err.errors.map((e) => ({ field: e.path, message: e.message })));
  }
  if (err instanceof ForeignKeyConstraintError) return new AppError(400, 'مرجع غير صالح');
  if (err.type === 'entity.parse.failed') return new AppError(400, 'صيغة JSON غير صحيحة');
  if (err.type === 'entity.too.large') return new AppError(413, 'حجم الطلب أكبر من المسموح');
  return null;
}

function notFound(req, _res, next) {
  next(AppError.notFound(req.originalUrl.startsWith('/api/') ? 'المسار غير موجود' : 'الصفحة غير موجودة'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const known = normalize(err);
  const status = known ? known.statusCode : 500;
  const message = known ? known.message : 'حدث خطأ غير متوقع، حاول لاحقاً';

  if (!known) console.error('[error]', req.method, req.originalUrl, err);

  if (req.originalUrl.startsWith('/api/') || req.accepts(['html', 'json']) === 'json') {
    const body = { success: false, message };
    if (known?.details) body.errors = known.details;
    if (!known && !env.isProd) body.debug = err.message;
    return res.status(status).json(body);
  }

  return res.status(status).render('errors/error', { title: message, status, message });
}

module.exports = { notFound, errorHandler };
