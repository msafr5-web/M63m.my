'use strict';

const express = require('express');
const a = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate');
const { authenticate, requireRole } = require('../../middlewares/authMiddleware');
const { apiLimiter, authLimiter } = require('../../middlewares/rateLimiter');
const v = require('../../validators');
const auth = require('../../controllers/authController');
const market = require('../../controllers/marketplaceController');
const consult = require('../../controllers/consultationController');

const router = express.Router();
router.use(apiLimiter);

/** Like authenticate, but lets anonymous requests through (req.user stays undefined). */
const optionalAuth = (req, res, next) => authenticate(req, res, () => next());

// --- Auth ---
router.post('/auth/register', authLimiter, validate(v.register), a(auth.register));
router.post('/auth/login', authLimiter, validate(v.login), a(auth.login));
router.post('/auth/logout', auth.logout);
router.get('/auth/me', authenticate, a(auth.me));

// --- Marketplace ---
router.get('/marketplace/items', validate(v.listItemsQuery, 'query'), a(market.listItems));
router.post('/marketplace/items', authenticate, validate(v.createItem), a(market.createItem));
router.get('/marketplace/items/:id', validate(v.uuidParam, 'params'), optionalAuth, a(market.getItem));
router.patch(
  '/marketplace/items/:id/status',
  authenticate,
  validate(v.uuidParam, 'params'),
  validate(v.updateItemStatus),
  a(market.updateStatus)
);

// --- Consultations ---
router.get('/consultations/consultants', a(consult.listConsultants));
router.get('/consultations/consultants/:id/slots', validate(v.uuidParam, 'params'), a(consult.getConsultantSlots));
router.post('/consultations/slots', authenticate, requireRole('CONSULTANT'), validate(v.createSlots), a(consult.createSlots));
router.post('/consultations/book', authenticate, validate(v.bookConsultation), a(consult.book));
router.get('/consultations/mine', authenticate, a(consult.listMine));
router.patch(
  '/consultations/:id/status',
  authenticate,
  validate(v.uuidParam, 'params'),
  validate(v.updateConsultationStatus),
  a(consult.updateStatus)
);

// --- Admin ---
router.patch(
  '/admin/consultants/:id/verify',
  authenticate,
  requireRole('ADMIN'),
  validate(v.uuidParam, 'params'),
  a(consult.verifyConsultant)
);

module.exports = router;
