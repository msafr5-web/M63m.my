# m63m.my — مطعم

منصة استشارات وخدمات قطاع المطاعم والمقاهي: استشارات الخبراء بالحجز المباشر، وسوق متخصص (وظائف، أجهزة ومعدات، منتجات وموردون، خدمات مساندة) مع نشر تلقائي على منصات التواصل.

**Stack:** Node.js 20+ · Express 4 · PostgreSQL + Sequelize · EJS (RTL) · BullMQ/Redis (اختياري) · JWT · Jest + Supertest

## التشغيل محلياً

```bash
npm install
cp .env.example .env            # ثم عدّل DATABASE_URL و JWT_SECRET
psql -U postgres -f scripts/create-db.sql   # مرة واحدة: ينشئ المستخدم وقاعدة m63m
npm run db:seed                 # جداول + بيانات تجريبية (كلمة المرور تظهر في المخرجات)
npm run dev                     # http://localhost:3000
```

| الأمر | الوظيفة |
|---|---|
| `npm run dev` | تشغيل مع إعادة تحميل تلقائي |
| `npm start` | تشغيل إنتاجي (`CLUSTER_WORKERS=max` لاستخدام كل الأنوية) |
| `npm run worker` | عامل BullMQ للنشر الاجتماعي (فقط عند ضبط `REDIS_URL`) |
| `npm run db:sync` | إنشاء الجداول الناقصة (لا يعدّل الجداول الموجودة) |
| `npm run db:seed` | بيانات تجريبية (يرفض العمل في production) |
| `npm test` | اختبارات الوحدة والمسارات (لا تحتاج قاعدة بيانات) |

## البنية

```
src/
  app.js            إعداد Express: helmet/CSP، CORS، ضغط، تحليل، ملفات ثابتة، المسارات
  server.js         نقطة الإقلاع: اتصال القاعدة، cluster، إغلاق آمن (graceful shutdown)
  config/           env (تحقق zod صارم) · database · redis · social_apis
  models/           User · ConsultantSlot · Consultation · MarketplaceItem · SocialPostLog
  validators/       مخططات zod لكل مدخلات الـ API
  middlewares/      authMiddleware (JWT) · validate · rateLimiter · errorHandler
  services/         marketplace · consultation (حجز ذري بقفل صف) · socialPublisher · queue
  controllers/      auth · marketplace · consultation · page (صفحات EJS)
  routes/           api/index.js (/api/v1) · web.js
  workers/          socialMediaWorker.js (BullMQ)
  views/            قوالب EJS عربية RTL
public/             css/app.css (نظام التصميم) · js/app.js · img/
scripts/            create-db.sql · sync.js · seed.js
tests/              Jest + Supertest
docs/               REQUIREMENTS.md (ملخص PRD + SWET والقرارات)
```

## واجهة API (v1)

| Method | Path | Auth | الوصف |
|---|---|---|---|
| POST | `/api/v1/auth/register` | — | تسجيل (CLIENT / CONSULTANT / VENDOR) |
| POST | `/api/v1/auth/login` | — | دخول؛ يعيد token ويضبط كوكي httpOnly |
| POST | `/api/v1/auth/logout` | — | خروج |
| GET | `/api/v1/auth/me` | JWT | المستخدم الحالي |
| GET | `/api/v1/marketplace/items` | — | قائمة مع `category, q, location, page, limit` |
| POST | `/api/v1/marketplace/items` | JWT | إضافة طلب + `auto_share_platforms` |
| GET | `/api/v1/marketplace/items/:id` | اختياري | التفاصيل (بيانات التواصل للمسجلين فقط) |
| PATCH | `/api/v1/marketplace/items/:id/status` | المالك/المدير | ACTIVE / CLOSED / PENDING |
| GET | `/api/v1/consultations/consultants` | — | المستشارون المعتمدون مع ملخص المواعيد |
| GET | `/api/v1/consultations/consultants/:id/slots` | — | المواعيد المتاحة |
| POST | `/api/v1/consultations/slots` | CONSULTANT | إضافة مواعيد (يمنع التداخل) |
| POST | `/api/v1/consultations/book` | JWT | حجز موعد |
| GET | `/api/v1/consultations/mine` | JWT | جلساتي |
| PATCH | `/api/v1/consultations/:id/status` | المشارك | بدء/إنهاء (المستشار)، إلغاء (الطرفان) |
| PATCH | `/api/v1/admin/consultants/:id/verify` | ADMIN | اعتماد مستشار |
| GET | `/health` | — | حالة الخادم وقاعدة البيانات |

الأخطاء موحّدة: `{ "success": false, "message": "...", "errors": [{ "field", "message" }] }` مع 400/401/403/404/409/422.

## النشر على منصات التواصل

- عند إنشاء طلب مع `auto_share_platforms` تُنشأ مهمة لكل منصة.
- **مع `REDIS_URL`**: BullMQ + `npm run worker`، حتى 3 محاولات بتأخير تصاعدي.
- **بدون Redis**: تُنفَّذ داخل العملية بعد إرسال الرد، بنفس سياسة المحاولات.
- كل نتيجة نهائية تُسجَّل في `social_posts_log`: `SUCCESS` / `FAILED` / `SKIPPED` (منصة بلا مفاتيح).
- X و Facebook مفعّلان عند وضع المفاتيح في `.env`. TikTok و Snapchat تتطلبان بطاقات وسائط مولّدة (مرحلة لاحقة) وتُسجَّلان حالياً `FAILED` بسبب واضح.

## النشر على Vercel

- المشروع `m63m-my` في فريق `msafr5-2354`، مربوط بفرع `main` — كل push ينشر تلقائياً.
- `api/index.js` يصدّر تطبيق Express كدالة serverless؛ `vercel.json` يوجّه كل الطلبات إليها، و`public/` تُخدم من CDN.
- قاعدة البيانات: Neon (Frankfurt، `fra1`) عبر Vercel Marketplace؛ `DATABASE_URL` يُحقن تلقائياً.
- متغيرات الإنتاج: `JWT_SECRET`, `APP_URL`, `CORS_ORIGINS`, `DB_SSL=true`, `DB_SYNC=false`.
- إنشاء الجداول أو المدير على Neon (من الجهاز المحلي بالرابط غير المجمّع `DATABASE_URL_UNPOOLED`):
  `DATABASE_URL=... DB_SSL=true node scripts/sync.js` ثم `ADMIN_EMAIL=... ADMIN_PHONE=... node scripts/create-admin.js`
- بدون Redis على Vercel: النشر الاجتماعي يكتمل قبل إرسال الرد (الدالة تتجمد بعده).
