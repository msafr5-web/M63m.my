'use strict';

const env = require('./env');

const PLATFORMS = Object.freeze(['X', 'FACEBOOK', 'TIKTOK', 'SNAPCHAT']);

const credentials = {
  X: { bearerToken: env.X_BEARER_TOKEN },
  FACEBOOK: { pageId: env.FACEBOOK_PAGE_ID, accessToken: env.FACEBOOK_PAGE_ACCESS_TOKEN },
  TIKTOK: { accessToken: env.TIKTOK_ACCESS_TOKEN },
  SNAPCHAT: { accessToken: env.SNAPCHAT_ACCESS_TOKEN },
};

function isConfigured(platform) {
  const c = credentials[platform];
  return Boolean(c) && Object.values(c).every(Boolean);
}

module.exports = { PLATFORMS, credentials, isConfigured };
