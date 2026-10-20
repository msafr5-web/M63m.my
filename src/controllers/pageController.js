'use strict';

const marketplace = require('../services/marketplace.service');
const consultations = require('../services/consultation.service');
const { listItemsQuery } = require('../validators');
const AppError = require('../utils/AppError');

const CATEGORIES = [
  { key: 'JOBS', label: 'الوظائف', hint: 'طهاة، باريستا، مدراء فروع وطاقم خدمة', icon: 'chef' },
  { key: 'EQUIPMENT', label: 'الأجهزة والمعدات', hint: 'معدات مطابخ، مكائن قهوة، كاشير وتبريد', icon: 'equipment' },
  { key: 'SUPPLIES', label: 'المنتجات والموردون', hint: 'مواد غذائية، بن، تغليف ومكونات', icon: 'supplies' },
  { key: 'SERVICES', label: 'الخدمات المساندة', hint: 'تصميم داخلي، تراخيص وتسويق', icon: 'services' },
];
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

const safeNext = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard');

async function home(_req, res) {
  const [latest, counts, consultants] = await Promise.all([
    marketplace.listItems({ limit: 6, page: 1 }),
    marketplace.countByCategory(),
    consultations.listConsultants(),
  ]);
  res.render('index', {
    title: 'منصة استشارات وخدمات المطاعم والمقاهي',
    categories: CATEGORIES,
    categoryMap: CATEGORY_MAP,
    counts,
    latest: latest.items,
    consultants: consultants.slice(0, 3),
  });
}

async function marketplaceIndex(req, res) {
  const parsed = listItemsQuery.safeParse(req.query);
  const filters = parsed.success ? parsed.data : { page: 1, limit: 12 };
  const [result, counts] = await Promise.all([marketplace.listItems(filters), marketplace.countByCategory()]);
  res.render('marketplace/index', {
    title: filters.category ? CATEGORY_MAP[filters.category].label : 'سوق الطلبات',
    categories: CATEGORIES,
    categoryMap: CATEGORY_MAP,
    counts,
    filters,
    items: result.items,
    pagination: result.pagination,
  });
}

function marketplaceNew(req, res) {
  const preset = CATEGORY_MAP[req.query.category] ? req.query.category : 'JOBS';
  res.render('marketplace/new', { title: 'نشر طلب جديد', categories: CATEGORIES, preset });
}

async function marketplaceShow(req, res) {
  const item = (await marketplace.getItem(req.params.id)).toJSON();
  if (item.status !== 'ACTIVE' && item.user_id !== req.user?.id && req.user?.role !== 'ADMIN') {
    throw AppError.notFound('الطلب غير موجود');
  }
  res.render('marketplace/show', {
    title: item.title,
    item,
    category: CATEGORY_MAP[item.category],
    isOwner: item.user_id === req.user?.id,
  });
}

async function consultantsIndex(_req, res) {
  res.render('consultations/index', { title: 'استشارات الخبراء', consultants: await consultations.listConsultants() });
}

async function consultantShow(req, res) {
  const { consultant, slots } = await consultations.getConsultantWithSlots(req.params.id);
  res.render('consultations/consultant', { title: consultant.full_name, consultant, slots });
}

async function dashboard(req, res) {
  const user = res.locals.currentUser;
  const [mine, items] = await Promise.all([consultations.listForUser(user), marketplace.listUserItems(user.id)]);
  const now = Date.now();
  const upcoming = mine.filter((c) => ['SCHEDULED', 'IN_PROGRESS'].includes(c.status));
  res.render('consultations/dashboard', {
    title: 'لوحة التحكم',
    consultations: mine,
    upcoming,
    past: mine.filter((c) => !upcoming.includes(c)),
    items,
    categoryMap: CATEGORY_MAP,
    stats: {
      upcoming: upcoming.length,
      completed: mine.filter((c) => c.status === 'COMPLETED').length,
      activeItems: items.filter((i) => i.status === 'ACTIVE').length,
      today: upcoming.filter((c) => c.slot && new Date(c.slot.start_time).toDateString() === new Date(now).toDateString()).length,
    },
  });
}

async function meetingRoom(req, res) {
  const consultation = await consultations.getForParticipant(req.user, req.params.id);
  res.render('consultations/meet', { title: consultation.topic, consultation });
}

function login(req, res) {
  if (res.locals.currentUser) return res.redirect(safeNext(req.query.next));
  return res.render('auth/login', { title: 'تسجيل الدخول', next: safeNext(req.query.next) });
}

function register(req, res) {
  if (res.locals.currentUser) return res.redirect('/dashboard');
  const role = ['CLIENT', 'CONSULTANT', 'VENDOR'].includes(req.query.role) ? req.query.role : 'CLIENT';
  return res.render('auth/register', { title: 'إنشاء حساب', role });
}

module.exports = {
  CATEGORIES,
  home,
  marketplaceIndex,
  marketplaceNew,
  marketplaceShow,
  consultantsIndex,
  consultantShow,
  dashboard,
  meetingRoom,
  login,
  register,
};
