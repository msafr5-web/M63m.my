'use strict';

class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(msg, details) { return new AppError(400, msg, details); }
  static unauthorized(msg = 'يجب تسجيل الدخول أولاً') { return new AppError(401, msg); }
  static forbidden(msg = 'ليست لديك صلاحية لهذا الإجراء') { return new AppError(403, msg); }
  static notFound(msg = 'العنصر المطلوب غير موجود') { return new AppError(404, msg); }
  static conflict(msg) { return new AppError(409, msg); }
}

module.exports = AppError;
