'use strict';

const express = require('express');
const a = require('../utils/asyncHandler');
const validate = require('../middlewares/validate');
const { attachCurrentUser, requireLoginPage } = require('../middlewares/authMiddleware');
const { uuidParam } = require('../validators');
const page = require('../controllers/pageController');

const router = express.Router();
router.use(attachCurrentUser);

router.get('/', a(page.home));
router.get('/login', page.login);
router.get('/register', page.register);

router.get('/marketplace', a(page.marketplaceIndex));
router.get('/marketplace/new', requireLoginPage, page.marketplaceNew);
router.get('/marketplace/:id', validate(uuidParam, 'params'), a(page.marketplaceShow));

router.get('/consultations', a(page.consultantsIndex));
router.get('/consultations/:id', validate(uuidParam, 'params'), a(page.consultantShow));
router.get('/dashboard', requireLoginPage, a(page.dashboard));
router.get('/meet/:id', requireLoginPage, validate(uuidParam, 'params'), a(page.meetingRoom));

module.exports = router;
