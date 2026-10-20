'use strict';

const AppError = require('../utils/AppError');
const { COOKIE_NAME, verifyToken } = require('../utils/jwt');
const { User } = require('../models');

function extractToken(req) {
  const header = req.get('authorization') || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return req.cookies?.[COOKIE_NAME] || null;
}

function decode(req) {
  const token = extractToken(req);
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    return { id: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

/**
 * Stateless JWT check for API routes: accepts a Bearer token or the session cookie.
 * Sets req.user = { id, role } from the token claims without a database round-trip.
 */
function authenticate(req, _res, next) {
  const user = decode(req);
  if (!user) return next(AppError.unauthorized());
  req.user = user;
  return next();
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    return next();
  };
}

/**
 * For server-rendered pages: loads the signed-in user (if any) into res.locals.currentUser
 * so layouts can show the account menu. Never blocks the request.
 */
async function attachCurrentUser(req, res, next) {
  res.locals.currentUser = null;
  const claims = decode(req);
  if (!claims) return next();
  try {
    const user = await User.findByPk(claims.id);
    if (user) {
      req.user = { id: user.id, role: user.role };
      res.locals.currentUser = user.toJSON();
    }
  } catch (err) {
    console.error('[auth] could not load current user:', err.message);
  }
  return next();
}

/** Page guard: redirects anonymous visitors to the login page and returns them afterwards. */
function requireLoginPage(req, res, next) {
  if (res.locals.currentUser) return next();
  return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
}

module.exports = { authenticate, requireRole, attachCurrentUser, requireLoginPage };
