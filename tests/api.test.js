'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');
const { signToken } = require('../src/utils/jwt');

// These routes are exercised without a database: auth and validation reject before any query.
const app = createApp();
const clientToken = signToken({ id: '6f1c2a10-0000-4000-8000-000000000001', role: 'CLIENT' });

describe('security middleware', () => {
  test('sets helmet headers and hides x-powered-by', async () => {
    const res = await request(app).get('/css/app.css');
    expect(res.status).toBe(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['content-security-policy']).toContain("script-src 'self'");
  });
});

describe('POST /api/v1/marketplace/items', () => {
  test('401 without a token', async () => {
    const res = await request(app).post('/api/v1/marketplace/items').send({});
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('401 with a forged token', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/items')
      .set('Authorization', 'Bearer not.a.jwt')
      .send({});
    expect(res.status).toBe(401);
  });

  test('422 with field errors for an invalid body', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ category: 'FOOD', title: 'x' });
    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['category', 'title', 'description']));
  });

  test('400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .set('Content-Type', 'application/json')
      .send('{"category":');
    expect(res.status).toBe(400);
  });
});

describe('role guards', () => {
  test('clients cannot publish consultant availability', async () => {
    const res = await request(app)
      .post('/api/v1/consultations/slots')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ slots: [] });
    expect(res.status).toBe(403);
  });

  test('admin endpoint rejects non-admins', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/consultants/6f1c2a10-0000-4000-8000-000000000002/verify')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/v1/consultations/book', () => {
  test('422 when ids are not UUIDs', async () => {
    const res = await request(app)
      .post('/api/v1/consultations/book')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ consultant_id: '1', slot_id: '2', topic: 'استشارة تشغيل' });
    expect(res.status).toBe(422);
  });
});

describe('unknown routes', () => {
  test('API 404 is JSON', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('المسار غير موجود');
  });
});
