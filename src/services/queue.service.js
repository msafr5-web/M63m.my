'use strict';

const { getRedisConnection } = require('../config/redis');
const { MarketplaceItem, SocialPostLog } = require('../models');
const { publish, PermanentPublishError } = require('./socialPublisher.service');

const QUEUE_NAME = 'social-publish';
const MAX_ATTEMPTS = 3;

let queue = null;
const inFlight = new Set();

function getQueue() {
  const connection = getRedisConnection();
  if (!connection) return null;
  if (!queue) {
    // Lazy require keeps bullmq/ioredis out of the process when Redis is not configured.
    const { Queue } = require('bullmq');
    queue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: MAX_ATTEMPTS,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }
  return queue;
}

async function writeLog(itemId, platform, result) {
  await SocialPostLog.create({
    item_id: itemId,
    platform,
    status: result.status,
    external_post_id: result.externalId || null,
    response_payload: result.payload || null,
  });
}

/**
 * Runs one publish attempt and logs the final outcome.
 * `isLastAttempt` decides whether a retriable failure is logged now or left for the next retry.
 */
async function processPublishJob({ itemId, platform }, { isLastAttempt }) {
  const item = await MarketplaceItem.findByPk(itemId);
  if (!item) return { status: 'SKIPPED', reason: 'item deleted' };

  try {
    const result = await publish(platform, item);
    await writeLog(itemId, platform, result);
    return result;
  } catch (err) {
    const permanent = err instanceof PermanentPublishError;
    if (permanent || isLastAttempt) {
      await writeLog(itemId, platform, { status: 'FAILED', payload: { error: err.message } });
    }
    if (permanent) return { status: 'FAILED', reason: err.message };
    throw err;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** In-process fallback with the same retry policy as BullMQ, run after the HTTP response is sent. */
function runInline(itemId, platform) {
  const task = (async () => {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        await processPublishJob({ itemId, platform }, { isLastAttempt: attempt === MAX_ATTEMPTS });
        return;
      } catch (err) {
        if (attempt === MAX_ATTEMPTS) {
          console.error(`[social] ${platform} failed for item ${itemId}:`, err.message);
          return;
        }
        await sleep(1000 * 2 ** attempt);
      }
    }
  })().catch((err) => console.error('[social] inline publisher crashed:', err));

  inFlight.add(task);
  task.finally(() => inFlight.delete(task));
  return task;
}

/**
 * Schedules auto-posting of a marketplace item to the selected platforms.
 * One job per platform so a failing platform retries independently of the others.
 * @returns {Promise<'queue'|'inline'|'none'>}
 */
async function enqueueSocialPublish(itemId, platforms) {
  const unique = [...new Set(platforms)];
  if (!unique.length) return 'none';

  const q = getQueue();
  if (q) {
    await q.addBulk(
      unique.map((platform) => ({
        name: 'publish',
        data: { itemId, platform },
        opts: { jobId: `${itemId}__${platform}` }, // idempotent per item/platform (BullMQ forbids ':')
      }))
    );
    return 'queue';
  }

  const tasks = unique.map((platform) => runInline(itemId, platform));
  // Serverless functions are frozen once the response is sent, so finish publishing first there.
  if (process.env.VERCEL) await Promise.allSettled(tasks);
  return 'inline';
}

/** Waits for in-process publishes during graceful shutdown, then closes the queue connection. */
async function closeQueue() {
  await Promise.allSettled([...inFlight]);
  if (queue) await queue.close();
  queue = null;
}

module.exports = { QUEUE_NAME, MAX_ATTEMPTS, enqueueSocialPublish, processPublishJob, closeQueue };
