'use strict';

/**
 * BullMQ worker for social auto-posting. Run as a separate process: `npm run worker`.
 * Only needed when REDIS_URL is set; without Redis the API publishes in-process.
 */
const { Worker } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const { sequelize } = require('../models');
const { QUEUE_NAME, processPublishJob } = require('../services/queue.service');

const connection = getRedisConnection();
if (!connection) {
  console.error('[worker] REDIS_URL is not set; nothing to consume.');
  process.exit(1);
}

const worker = new Worker(
  QUEUE_NAME,
  (job) => processPublishJob(job.data, { isLastAttempt: job.attemptsMade + 1 >= (job.opts.attempts || 1) }),
  { connection, concurrency: 5 }
);

worker.on('completed', (job, result) => console.log(`[worker] ${job.id} -> ${result?.status}`));
worker.on('failed', (job, err) => console.warn(`[worker] ${job?.id} attempt ${job?.attemptsMade} failed: ${err.message}`));

async function shutdown(signal) {
  console.log(`[worker] ${signal} received, closing...`);
  await worker.close();
  await sequelize.close();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

console.log(`[worker] listening on queue "${QUEUE_NAME}"`);
