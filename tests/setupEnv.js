'use strict';

// Deterministic test configuration; no real database or Redis is contacted by the unit suite.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-validation-123';
process.env.DATABASE_URL = 'postgres://test:test@127.0.0.1:1/m63m_test';
process.env.APP_URL = 'https://m63m.my';
process.env.BCRYPT_COST = '12';
process.env.REDIS_URL = '';
process.env.X_BEARER_TOKEN = '';
process.env.FACEBOOK_PAGE_ID = '';
process.env.FACEBOOK_PAGE_ACCESS_TOKEN = '';
