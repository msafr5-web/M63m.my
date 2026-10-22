'use strict';

/**
 * Demo content for the public site, with fictional names.
 *   node scripts/demo-content.js add      — creates demo users, listings and consultant slots (idempotent)
 *   node scripts/demo-content.js remove   — deletes every demo user; their listings, slots and bookings cascade
 * Demo users are identified by the `demo-` email prefix. Passwords are random and never printed,
 * so nobody can sign in as a demo user. No admin account is created.
 */
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const env = require('../src/config/env');
const { sequelize, User, MarketplaceItem, ConsultantSlot } = require('../src/models');

const PREFIX = 'demo-';
const DOMAIN = '@m63m.my';

const USERS = [
  {
    key: 'khaled', full_name: 'خالد المنصور', role: 'CONSULTANT', phone: '0590000101',
    bio: 'مستشار تشغيل مطاعم ومقاهٍ بخبرة تتجاوز 15 عاماً في السوق السعودي: ضبط التكاليف وتقليل الهدر، هندسة القوائم، تجهيز الافتتاح، وبناء أنظمة التشغيل القياسية للفروع.',
    price: 350,
  },
  {
    key: 'sara', full_name: 'سارة العتيبي', role: 'CONSULTANT', phone: '0590000102',
    bio: 'متخصصة في القهوة المختصة وتجربة العميل: اختيار المعدات، تدريب الباريستا، وتصميم رحلة العميل داخل الكافيه.',
    price: 250,
  },
  {
    key: 'fahad', full_name: 'فهد الدوسري', role: 'CONSULTANT', phone: '0590000103',
    bio: 'مستشار تسويق وتوسع للعلامات الغذائية: دراسات الجدوى، اختيار المواقع، الامتياز التجاري، وإطلاق الفروع الجديدة.',
    price: 400,
  },
  { key: 'owner', full_name: 'عبدالله القحطاني', role: 'CLIENT', phone: '0590000104' },
  { key: 'cafe', full_name: 'نورة الشهري', role: 'CLIENT', phone: '0590000105' },
  { key: 'vendor', full_name: 'مؤسسة الحلول الذهبية', role: 'VENDOR', phone: '0590000106' },
  { key: 'supply', full_name: 'شركة المذاق للتوريد', role: 'VENDOR', phone: '0590000107' },
];

const ITEMS = [
  { owner: 'owner', category: 'JOBS', title: 'مطلوب باريستا محترف - الرياض', location: 'الرياض - حي الملقا',
    description: 'خبرة 3 سنوات في إعداد القهوة المختصة، إتقان الإسبريسو والـ V60، نقل كفالة فوري، سكن ومواصلات.',
    metadata: { job_title: 'Head Barista', salary_range: '4000-5000 SAR', experience_years: 3, employment_type: 'دوام كامل' } },
  { owner: 'owner', category: 'JOBS', title: 'مدير فرع لمطعم وجبات سريعة', location: 'جدة - حي الروضة',
    description: 'إدارة فريق من 18 موظفاً، متابعة التكاليف اليومية والجرد، خبرة لا تقل عن 4 سنوات في إدارة الفروع.',
    metadata: { job_title: 'Branch Manager', salary_range: '9000-11000 SAR', experience_years: 4, employment_type: 'دوام كامل' } },
  { owner: 'cafe', category: 'JOBS', title: 'مطلوب شيف حلويات لكافيه مختص', location: 'الخبر - حي العليا',
    description: 'خبرة في الحلويات الفرنسية والكيك اليومي، القدرة على تطوير منيو موسمي، العمل بنظام الورديتين.',
    metadata: { job_title: 'Pastry Chef', salary_range: '6000-7500 SAR', experience_years: 3, employment_type: 'دوام كامل' } },
  { owner: 'cafe', category: 'JOBS', title: 'طاقم خدمة بدوام جزئي لعطلة نهاية الأسبوع', location: 'الرياض - حي النرجس',
    description: 'مطلوب 3 موظفين خدمة لأيام الخميس والجمعة والسبت، يفضّل من لديه خبرة سابقة في الكافيهات.',
    metadata: { job_title: 'Service Staff', employment_type: 'دوام جزئي' } },
  { owner: 'vendor', category: 'EQUIPMENT', title: 'مكينة إسبريسو La Marzocco Linea PB - مجموعتين', location: 'الرياض', price: 38500,
    description: 'مكينة بحالة ممتازة، استخدام سنة واحدة، صيانة دورية موثقة، مع مطحنة Mazzer هدية.',
    metadata: { condition: 'مستعملة - ممتازة', brand: 'La Marzocco' } },
  { owner: 'cafe', category: 'EQUIPMENT', title: 'مطلوب ثلاجة عرض حلويات بطول 1.5 متر', location: 'الدمام',
    description: 'نبحث عن ثلاجة عرض زجاجية منحنية بحالة جيدة لفرع جديد، يفضّل مع ضمان.',
    metadata: { condition: 'مطلوب شراء' } },
  { owner: 'vendor', category: 'EQUIPMENT', title: 'نظام كاشير متكامل مع شاشة مطبخ', location: 'المنطقة الوسطى', price: 6900,
    description: 'جهاز كاشير بشاشة لمس، طابعة فواتير، وشاشة طلبات للمطبخ، مع تركيب وتدريب للموظفين.',
    metadata: { condition: 'جديدة', brand: 'POS Pro' } },
  { owner: 'supply', category: 'SUPPLIES', title: 'توريد بن مختص محمص طازج للمقاهي', location: 'المنطقة الوسطى',
    description: 'محاصيل إثيوبية وكولومبية وبرازيلية، تحميص أسبوعي، تغليف بصمام، توصيل خلال 48 ساعة.',
    metadata: { supplier_name: 'شركة المذاق للتوريد', min_order: '10 كجم' } },
  { owner: 'supply', category: 'SUPPLIES', title: 'أكواب ورقية وأغطية مطبوعة بشعارك', location: 'جميع مناطق المملكة',
    description: 'أكواب مزدوجة الجدار بأحجام 8 و12 و16 أونصة، طباعة شعار بلونين، تسليم خلال أسبوعين.',
    metadata: { supplier_name: 'شركة المذاق للتوريد', min_order: '5000 كوب' } },
  { owner: 'vendor', category: 'SERVICES', title: 'استخراج تراخيص البلدية والدفاع المدني للمطاعم', location: 'الرياض والقصيم',
    description: 'متابعة كاملة لرخصة النشاط، الشهادات الصحية، اشتراطات الدفاع المدني ومطابقة المخططات.',
    metadata: { service_type: 'تراخيص حكومية', coverage: 'الرياض والقصيم' } },
  { owner: 'vendor', category: 'SERVICES', title: 'تصميم داخلي وتنفيذ للكافيهات الصغيرة', location: 'جدة ومكة',
    description: 'تصميم ثلاثي الأبعاد، توزيع منطقة البار والجلسات، وتنفيذ كامل خلال 45 يوماً.',
    metadata: { service_type: 'تصميم داخلي', coverage: 'جدة ومكة' } },
];

const emailFor = (key) => `${PREFIX}${key}${DOMAIN}`;

/** Three one-hour slots a day (16:00, 18:00, 20:00 Riyadh time) for the next 21 days. */
function slotsFor(consultantId, price) {
  const slots = [];
  const base = new Date();
  base.setUTCMinutes(0, 0, 0);
  for (let day = 1; day <= 21; day += 1) {
    for (const hourRiyadh of [16, 18, 20]) {
      const s = new Date(base);
      s.setUTCDate(s.getUTCDate() + day);
      s.setUTCHours(hourRiyadh - 3);
      slots.push({ consultant_id: consultantId, start_time: s, end_time: new Date(s.getTime() + 3600e3), price });
    }
  }
  return slots;
}

async function add() {
  const byKey = {};
  for (const u of USERS) {
    const password_hash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), env.BCRYPT_COST);
    const { key, price: _p, ...fields } = u;
    const [user] = await User.findOrCreate({
      where: { email: emailFor(key) },
      defaults: { ...fields, email: emailFor(key), password_hash, is_verified: true },
    });
    byKey[key] = user;
  }

  const ids = Object.values(byKey).map((u) => u.id);
  if ((await MarketplaceItem.count({ where: { user_id: ids } })) === 0) {
    // Stagger creation times so the feed reads naturally (newest first).
    const now = Date.now();
    await MarketplaceItem.bulkCreate(
      ITEMS.map(({ owner, ...it }, i) => ({ ...it, user_id: byKey[owner].id, created_at: new Date(now - (i + 1) * 5.5 * 3600e3) }))
    );
  }

  for (const u of USERS.filter((x) => x.role === 'CONSULTANT')) {
    const id = byKey[u.key].id;
    const future = await ConsultantSlot.count({ where: { consultant_id: id, start_time: { [Op.gt]: new Date() } } });
    if (future === 0) await ConsultantSlot.bulkCreate(slotsFor(id, u.price));
  }

  const items = await MarketplaceItem.count({ where: { user_id: ids } });
  console.log(`[demo] ${USERS.length} demo users, ${items} listings, consultant slots ready`);
}

async function remove() {
  const n = await User.destroy({ where: { email: { [Op.like]: `${PREFIX}%${DOMAIN}` } } });
  console.log(`[demo] removed ${n} demo users (their listings, slots and bookings cascade)`);
}

(async () => {
  const mode = process.argv[2];
  if (!['add', 'remove'].includes(mode)) {
    console.error('usage: node scripts/demo-content.js add|remove');
    process.exit(1);
  }
  try {
    await sequelize.authenticate();
    await (mode === 'add' ? add() : remove());
  } catch (err) {
    console.error('[demo] failed:', err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
