'use strict';

/**
 * Vercel serverless entry point. Every request is rewritten here (see vercel.json); static files
 * in /public are served by Vercel's CDN before the rewrite applies. Locally use src/server.js.
 */
require('../src/models');
const { createApp } = require('../src/app');

module.exports = createApp();
