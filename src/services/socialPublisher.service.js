'use strict';

const env = require('../config/env');
const { credentials, isConfigured } = require('../config/social_apis');

const CATEGORY_TAGS = {
  JOBS: ['#وظائف_المطاعم', '#وظائف_الكافيهات', '#وظائف'],
  EQUIPMENT: ['#معدات_مطاعم', '#مكائن_قهوة'],
  SUPPLIES: ['#موردين', '#توريد_مطاعم'],
  SERVICES: ['#خدمات_المطاعم', '#تشغيل_مطاعم'],
};

const CATEGORY_LABELS = {
  JOBS: 'وظيفة',
  EQUIPMENT: 'معدات وأجهزة',
  SUPPLIES: 'منتجات وموردين',
  SERVICES: 'خدمات مساندة',
};

/** Thrown when a platform answers with a non-retriable outcome (bad credentials, rejected content). */
class PermanentPublishError extends Error {}

function itemUrl(item) {
  return `${env.APP_URL.replace(/\/$/, '')}/marketplace/${item.id}`;
}

/**
 * Builds the shared post body. X caps posts at 280 characters (URLs count as 23),
 * so the title is trimmed to keep link and hashtags intact.
 */
function buildPostText(item, { maxLength = 280 } = {}) {
  const url = itemUrl(item);
  const tags = (CATEGORY_TAGS[item.category] || []).concat('#m63m').join(' ');
  const label = CATEGORY_LABELS[item.category] || '';
  const location = item.location ? ` | ${item.location}` : '';
  const head = `${label}: `;
  const tail = `${location}\n${url}\n${tags}`;
  const URL_WEIGHT = 23;
  const budget = maxLength - head.length - (tail.length - url.length + URL_WEIGHT);
  const title = item.title.length > budget ? `${item.title.slice(0, Math.max(0, budget - 1))}…` : item.title;
  return `${head}${title}${tail}`;
}

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 2000) };
  }
}

async function postToX(item) {
  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${credentials.X.bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: buildPostText(item) }),
    signal: AbortSignal.timeout(15000),
  });
  const payload = await readJson(res);
  if (res.status === 401 || res.status === 403) throw new PermanentPublishError(`X rejected credentials (${res.status})`);
  if (!res.ok) throw new Error(`X API ${res.status}`);
  return { externalId: payload?.data?.id || null, payload };
}

async function postToFacebook(item) {
  const { pageId, accessToken } = credentials.FACEBOOK;
  const body = new URLSearchParams({
    message: buildPostText(item, { maxLength: 2000 }),
    link: itemUrl(item),
    access_token: accessToken,
  });
  const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/feed`, {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(15000),
  });
  const payload = await readJson(res);
  if (res.status === 400 || res.status === 401 || res.status === 403) {
    throw new PermanentPublishError(`Facebook rejected the post (${res.status})`);
  }
  if (!res.ok) throw new Error(`Facebook Graph API ${res.status}`);
  return { externalId: payload?.id || null, payload };
}

/**
 * TikTok and Snapchat only accept media (video / story) uploads. Generating promo cards is a
 * later roadmap phase, so these adapters report a permanent, explicit outcome instead of failing silently.
 */
async function mediaOnlyPlatform(platform) {
  throw new PermanentPublishError(`${platform} requires generated media cards (not enabled yet)`);
}

const adapters = {
  X: postToX,
  FACEBOOK: postToFacebook,
  TIKTOK: () => mediaOnlyPlatform('TikTok'),
  SNAPCHAT: () => mediaOnlyPlatform('Snapchat'),
};

/**
 * Publishes one item to one platform.
 * @returns {Promise<{status:'SUCCESS'|'SKIPPED', externalId?:string|null, payload:object}>}
 * @throws Error (retriable) or PermanentPublishError (do not retry)
 */
async function publish(platform, item) {
  const adapter = adapters[platform];
  if (!adapter) throw new PermanentPublishError(`Unknown platform ${platform}`);
  if (!isConfigured(platform)) {
    return { status: 'SKIPPED', externalId: null, payload: { reason: 'credentials not configured' } };
  }
  const { externalId, payload } = await adapter(item);
  return { status: 'SUCCESS', externalId, payload };
}

module.exports = { publish, buildPostText, PermanentPublishError };
