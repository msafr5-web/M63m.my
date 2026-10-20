'use strict';

const { rateLimit } = require('express-rate-limit');

const message = { success: false, message: 'عدد كبير من الطلبات، حاول مرة أخرى بعد قليل' };

/** General API budget per IP. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message,
});

/** Tight budget for credential endpoints to slow down brute force attempts. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message,
});

module.exports = { apiLimiter, authLimiter };
