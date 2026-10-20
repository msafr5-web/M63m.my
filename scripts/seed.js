'use strict';

/**
 * Demo data for local development. Idempotent: users are matched by email, and listings / slots
 * are only added when the demo users have none. Usage: npm run db:seed
 */
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const { sequelize, User, MarketplaceItem, ConsultantSlot } = require('../src/models');

if (env.isProd) {
  console.error('[seed] refusing to seed a production database');
  process.exit(1);
}

const PASSWORD = process.env.SEED_PASSWORD || 'M63m@demo2026';

const USERS = [
  { email: 'admin@m63m.my', full_name: 'إدارة المنصة', phone: '0500000001', role: 'ADMIN', is_verified: true },
  {
    email: 'consultant@m63m.my',
    full_name: 'محمد الشحادة',
    phone: '0500000002',
    role: 'CONSULTANT',
    is_verified: true,
    bio: 'مستشار تشغيل مطاعم ومقاهٍ بخبرة تتجاوز 15 عاماً في السوق السعودي: ضبط التكاليف وتقليل الهدر، هندسة القوائم، تجهيز الافتتاح، وبناء أنظمة التشغيل القياسية للفروع.',
  },
  {
    email: 'sara@m63m.my',
    full_name: 'سارة العتيبي',
    phone: '0500000003',
    role: 'CONSULTANT',
    is_verified: true,
    bio: 'متخصصة في القهوة المختصة وتجربة العميل: اختيار المعدات، تدريب الباريستا، وتصميم رحلة العميل داخل الكافيه.',
  },
  { email: 'owner@m63m.my', full_name: 'عبدالله القحطاني', phone: '0500000004', role: 'CLIENT', is_verified: true },
  { email: 'vendor@m63m.my', full_name: 'مؤسسة الحلول الذهبية', phone: '0500000005', role: 'VENDOR', is_verified: true },
];

const ITEMS = [
  {
    owner: 'owner@m63m.my', category: 'JOBS', title: 'مطلوب باريستا محترف - الرياض', location: 'الرياض - حي الملقا',
    description: 'خبرة 3 سنوات في إعداد القهوة المختصة، إتقان الإسبريسو والـ V60، نقل كفالة فوري، سكن ومواصلات.',
    metadata: { job_title: 'Head Barista', salary_range: '4000-5000 SAR', experience_years: 3, employment_type: 'دوام كامل' },
  },
  {
    owner: 'owner@m63m.my', category: 'JOBS', title: 'مدير فرع لمطعم وجبات سريعة', location: 'جدة - حي الروضة',
    description: 'إدارة فريق من 18 موظفاً، متابعة التكاليف اليومية والجرد، خبرة لا تقل عن 4 سنوات في إدارة الفروع.',
    metadata: { job_title: 'Branch Manager', salary_range: '9000-11000 SAR', experience_years: 4, employment_type: 'دوام كامل' },
  },
  {
    owner: 'vendor@m63m.my', category: 'EQUIPMENT', title: 'مكينة إسبريسو La Marzocco Linea PB - مجموعتين', location: 'الرياض', price: 38500,
    description: 'مكينة بحالة ممتازة، استخدام سنة واحدة، صيانة دورية موثقة، مع مطحنة Mazzer هدية.',
    metadata: { condition: 'مستعملة - ممتازة', brand: 'La Marzocco' },
  },
  {
    owner: 'vendor@m63m.my', category: 'SUPPLIES', title: 'توريد بن مختص محمص طازج للمقاهي', location: 'المنطقة الوسطى',
    description: 'محاصيل إثيوبية وكولومبية وبرازيلية، تحميص أسبوعي، تغليف بصمام، توصيل خلال 48 ساعة.',
    metadata: { supplier_name: 'محمصة الحلول الذهبية', min_order: '10 كجم' },
  },
  {
    owner: 'vendor@m63m.my', category: 'SERVICES', title: 'استخراج تراخيص البلدية والدفاع المدني للمطاعم', location: 'الرياض والقصيم',
    description: 'متابعة كاملة لرخصة النشاط، الشهادات الصحية، اشتراطات الدفاع المدني ومطابقة المخططات.',
    metadata: { service_type: 'تراخيص حكومية', coverage: 'الرياض والقصيم' },
  },
  {
    owner: 'owner@m63m.my', category: 'EQUIPMENT', title: 'مطلوب ثلاجة عرض حلويات بطول 1.5 متر', location: 'الدمام',
    description: 'نبحث عن ثلاجة عرض زجاجية منحنية بحالة جيدة لفرع جديد، يفضّل مع ضمان.',
    metadata: { condition: 'مطلوب شراء' },
  },
];

function slotsFor(consultantId, basePrice) {
  const slots = [];
  const start = new Date();
  start.setUTCMinutes(0, 0, 0);
  for (let day = 1; day <= 6; day += 1) {
    // 16:00, 18:00 and 20:00 Riyadh time (UTC+3).
    for (const hourRiyadh of [16, 18, 20]) {
      const s = new Date(start);
      s.setUTCDate(s.getUTCDate() + day);
      s.setUTCHours(hourRiyadh - 3);
      const e = new Date(s.getTime() + 60 * 60 * 1000);
      slots.push({ consultant_id: consultantId, start_time: s, end_time: e, price: basePrice });
    }
  }
  return slots;
}

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    const password_hash = await bcrypt.hash(PASSWORD, env.BCRYPT_COST);

    const byEmail = {};
    for (const u of USERS) {
      const [user] = await User.findOrCreate({ where: { email: u.email }, defaults: { ...u, password_hash } });
      byEmail[u.email] = user;
    }

    const demoIds = Object.values(byEmail).map((u) => u.id);
    if ((await MarketplaceItem.count({ where: { user_id: demoIds } })) === 0) {
      await MarketplaceItem.bulkCreate(ITEMS.map(({ owner, ...it }) => ({ ...it, user_id: byEmail[owner].id })));
    }

    for (const [email, price] of [['consultant@m63m.my', 350], ['sara@m63m.my', 250]]) {
      const id = byEmail[email].id;
      if ((await ConsultantSlot.count({ where: { consultant_id: id } })) === 0) {
        await ConsultantSlot.bulkCreate(slotsFor(id, price));
      }
    }

    console.log('[seed] done. Demo accounts (password: %s):', PASSWORD);
    USERS.forEach((u) => console.log(`  - ${u.role.padEnd(10)} ${u.email}`));
  } catch (err) {
    console.error('[seed] failed:', err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
