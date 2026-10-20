'use strict';

const { buildPostText, publish } = require('../src/services/socialPublisher.service');

const item = {
  id: 'c1f7b822-4411-4a39-9d51-83ef4b17a102',
  category: 'JOBS',
  title: 'مطلوب باريستا محترف - الرياض',
  location: 'الرياض - حي الملقا',
};

describe('buildPostText', () => {
  test('includes link, category label and hashtags', () => {
    const text = buildPostText(item);
    expect(text).toContain('https://m63m.my/marketplace/c1f7b822-4411-4a39-9d51-83ef4b17a102');
    expect(text).toContain('وظيفة');
    expect(text).toContain('#وظائف_المطاعم');
  });

  test('trims long titles to fit X weighted length (URL counts as 23)', () => {
    const text = buildPostText({ ...item, title: 'ب'.repeat(400) });
    const url = 'https://m63m.my/marketplace/' + item.id;
    const weighted = text.length - url.length + 23;
    expect(weighted).toBeLessThanOrEqual(280);
    expect(text).toContain('…');
    expect(text).toContain(url);
  });
});

describe('publish', () => {
  test('skips platforms without credentials instead of failing', async () => {
    const result = await publish('X', item);
    expect(result.status).toBe('SKIPPED');
  });

  test('unknown platforms are rejected', async () => {
    await expect(publish('UNKNOWN', item)).rejects.toThrow('Unknown platform');
  });
});
