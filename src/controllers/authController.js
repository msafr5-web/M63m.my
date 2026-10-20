'use strict';

const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const { COOKIE_NAME, signToken, cookieOptions } = require('../utils/jwt');

// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', env.BCRYPT_COST);

function issueSession(res, user) {
  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  return token;
}

async function register(req, res) {
  const { password, ...data } = req.body;
  const password_hash = await bcrypt.hash(password, env.BCRYPT_COST);
  const user = await User.create({ ...data, password_hash, is_verified: false });
  const token = issueSession(res, user);
  res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح', token, data: user.toJSON() });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) throw AppError.unauthorized('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  const token = issueSession(res, user);
  res.json({ success: true, message: 'تم تسجيل الدخول', token, data: user.toJSON() });
}

function logout(_req, res) {
  const { maxAge: _drop, ...opts } = cookieOptions();
  res.clearCookie(COOKIE_NAME, opts);
  res.json({ success: true, message: 'تم تسجيل الخروج' });
}

async function me(req, res) {
  const user = await User.findByPk(req.user.id);
  if (!user) throw AppError.unauthorized();
  res.json({ success: true, data: user.toJSON() });
}

module.exports = { register, login, logout, me };
