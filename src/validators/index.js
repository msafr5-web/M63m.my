'use strict';

const { z } = require('zod');
const { PLATFORMS } = require('../config/social_apis');

const ROLES_SELF_SERVICE = ['CLIENT', 'CONSULTANT', 'VENDOR']; // ADMIN is never self-assigned
const CATEGORIES = ['JOBS', 'EQUIPMENT', 'SUPPLIES', 'SERVICES'];

const trimmed = (min, max, msg) => z.string({ required_error: msg }).trim().min(min, msg).max(max);
const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const register = z.object({
  full_name: trimmed(3, 150, 'الاسم مطلوب (3 أحرف على الأقل)'),
  email: z.string().trim().toLowerCase().email('البريد الإلكتروني غير صحيح').max(255),
  // Saudi-friendly but tolerant: digits with optional leading +, 9-15 digits.
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(/^\+?\d{9,15}$/, 'رقم الجوال غير صحيح')),
  password: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل').max(128),
  role: z.enum(ROLES_SELF_SERVICE).default('CLIENT'),
  bio: optionalText(2000),
});

const login = z.object({
  email: z.string().trim().toLowerCase().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

const metadata = z
  .record(z.string().max(60), z.union([z.string().max(500), z.number(), z.boolean()]))
  .default({})
  .refine((m) => Object.keys(m).length <= 20, 'عدد الحقول الإضافية كبير');

const createItem = z.object({
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'اختر قسماً صحيحاً' }) }),
  title: trimmed(5, 200, 'العنوان مطلوب (5 أحرف على الأقل)'),
  description: trimmed(10, 5000, 'الوصف مطلوب (10 أحرف على الأقل)'),
  price: z.coerce.number().nonnegative('السعر غير صحيح').max(9999999999).optional().nullable(),
  location: optionalText(100),
  metadata,
  images: z.array(z.string().url().max(1000)).max(8).default([]),
  auto_share_platforms: z.array(z.enum(PLATFORMS)).max(PLATFORMS.length).default([]),
});

const listItemsQuery = z.object({
  category: z.enum(CATEGORIES).optional(),
  q: z.string().trim().max(100).optional(),
  location: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const updateItemStatus = z.object({ status: z.enum(['ACTIVE', 'CLOSED', 'PENDING']) });

const createSlots = z.object({
  slots: z
    .array(
      z
        .object({
          start_time: z.coerce.date(),
          end_time: z.coerce.date(),
          price: z.coerce.number().nonnegative().max(99999999),
        })
        .refine((s) => s.end_time > s.start_time, 'وقت النهاية يجب أن يكون بعد البداية')
        .refine((s) => s.start_time > new Date(), 'لا يمكن إضافة موعد في الماضي')
    )
    .min(1)
    .max(50),
});

const bookConsultation = z.object({
  consultant_id: z.string().uuid('معرّف المستشار غير صحيح'),
  slot_id: z.string().uuid('معرّف الموعد غير صحيح'),
  topic: trimmed(5, 255, 'موضوع الاستشارة مطلوب (5 أحرف على الأقل)'),
  notes: optionalText(3000),
});

const updateConsultationStatus = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

const uuidParam = z.object({ id: z.string().uuid('معرّف غير صحيح') });

module.exports = {
  register,
  login,
  createItem,
  listItemsQuery,
  updateItemStatus,
  createSlots,
  bookConsultation,
  updateConsultationStatus,
  uuidParam,
};
