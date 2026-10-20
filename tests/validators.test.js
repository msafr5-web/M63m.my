'use strict';

const v = require('../src/validators');

describe('createItem', () => {
  const base = {
    category: 'JOBS',
    title: 'مطلوب باريستا محترف - الرياض',
    description: 'خبرة 3 سنوات في إعداد القهوة المختصة',
    metadata: { job_title: 'Head Barista', experience_years: 3 },
    auto_share_platforms: ['X', 'FACEBOOK'],
  };

  test('accepts the SWET example payload', () => {
    const r = v.createItem.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data.images).toEqual([]);
  });

  test('rejects unknown category and platform', () => {
    expect(v.createItem.safeParse({ ...base, category: 'FOOD' }).success).toBe(false);
    expect(v.createItem.safeParse({ ...base, auto_share_platforms: ['INSTAGRAM'] }).success).toBe(false);
  });

  test('rejects nested objects in metadata', () => {
    expect(v.createItem.safeParse({ ...base, metadata: { a: { b: 1 } } }).success).toBe(false);
  });
});

describe('register', () => {
  const user = { full_name: 'عبدالله القحطاني', email: ' Owner@Example.com ', phone: '050 000-0004', password: 'longenough' };

  test('normalises email and phone, defaults role to CLIENT', () => {
    const r = v.register.parse(user);
    expect(r.email).toBe('owner@example.com');
    expect(r.phone).toBe('0500000004');
    expect(r.role).toBe('CLIENT');
  });

  test('never allows self-assigned ADMIN', () => {
    expect(v.register.safeParse({ ...user, role: 'ADMIN' }).success).toBe(false);
  });
});

describe('createSlots', () => {
  const future = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();

  test('accepts future slots', () => {
    expect(v.createSlots.safeParse({ slots: [{ start_time: future(24), end_time: future(25), price: 300 }] }).success).toBe(true);
  });

  test('rejects end before start and past slots', () => {
    expect(v.createSlots.safeParse({ slots: [{ start_time: future(25), end_time: future(24), price: 1 }] }).success).toBe(false);
    expect(v.createSlots.safeParse({ slots: [{ start_time: future(-2), end_time: future(-1), price: 1 }] }).success).toBe(false);
  });
});
