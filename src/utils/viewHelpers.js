'use strict';

const { icon } = require('./icons');

const TZ = 'Asia/Riyadh';

const dateFmt = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });
const dayFmt = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
const timeFmt = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const numFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

const STATUS_LABELS = {
  SCHEDULED: 'مجدولة',
  IN_PROGRESS: 'جارية',
  COMPLETED: 'مكتملة',
  CANCELLED: 'ملغاة',
  ACTIVE: 'نشط',
  CLOSED: 'مغلق',
  PENDING: 'قيد المراجعة',
};

const ROLE_LABELS = { CLIENT: 'صاحب منشأة', CONSULTANT: 'مستشار', VENDOR: 'مورد / باحث عن عمل', ADMIN: 'مدير المنصة' };

const METADATA_LABELS = {
  job_title: 'المسمى الوظيفي',
  salary_range: 'الراتب',
  experience_years: 'سنوات الخبرة',
  employment_type: 'نوع الدوام',
  condition: 'حالة المعدة',
  brand: 'العلامة التجارية',
  quantity: 'الكمية',
  supplier_name: 'اسم المورد',
  min_order: 'الحد الأدنى للطلب',
  service_type: 'نوع الخدمة',
  coverage: 'نطاق التغطية',
};

function relativeTime(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'الآن';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return mins <= 2 ? 'منذ دقيقة' : `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? 'منذ ساعة' : hours === 2 ? 'منذ ساعتين' : `منذ ${hours} ساعات`;
  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? 'أمس' : days === 2 ? 'منذ يومين' : `منذ ${days} أيام`;
  return dateFmt.format(new Date(date));
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '');
}

/** Groups slots by Riyadh calendar day for the booking picker. */
function groupSlotsByDay(slots) {
  const groups = new Map();
  for (const s of slots) {
    const key = dayKeyFmt.format(new Date(s.start_time));
    if (!groups.has(key)) groups.set(key, { key, label: dayFmt.format(new Date(s.start_time)), slots: [] });
    groups.get(key).slots.push(s);
  }
  return [...groups.values()];
}

/** Builds a pagination URL that keeps the active filters. */
function pageUrl(base, filters, page) {
  const params = new URLSearchParams();
  for (const [k, val] of Object.entries(filters)) {
    if (val !== undefined && val !== '' && k !== 'page' && k !== 'limit') params.set(k, val);
  }
  if (page > 1) params.set('page', page);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

module.exports = {
  icon,
  formatDate: (d) => dateFmt.format(new Date(d)),
  formatTime: (d) => timeFmt.format(new Date(d)),
  formatDay: (d) => dayFmt.format(new Date(d)),
  formatMoney: (n) => (n === null || n === undefined || n === '' ? null : `${numFmt.format(Number(n))} ر.س`),
  statusLabel: (s) => STATUS_LABELS[s] || s,
  roleLabel: (r) => ROLE_LABELS[r] || r,
  metaLabel: (k) => METADATA_LABELS[k] || k.replace(/_/g, ' '),
  relativeTime,
  initials,
  groupSlotsByDay,
  pageUrl,
};
