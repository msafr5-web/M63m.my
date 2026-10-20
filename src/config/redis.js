'use strict';

const env = require('./env');

/**
 * BullMQ connection options, or null when Redis is not configured.
 * Without Redis the app falls back to in-process publishing (see services/queue.service.js).
 */
function getRedisConnection() {
  if (!env.REDIS_URL) return null;
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) : 0,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}

module.exports = { getRedisConnection };
