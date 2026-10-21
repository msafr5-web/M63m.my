// Cleans e2e test leftovers from the LOCAL dev database and adds realistic demo bookings for screenshots.
process.chdir('C:/Users/abuhe/Desktop/my projects/M63m.my');
const { Op } = require('C:/Users/abuhe/Desktop/my projects/M63m.my/node_modules/sequelize');
const m = require('C:/Users/abuhe/Desktop/my projects/M63m.my/src/models');
const B = 'http://localhost:3000';
const post = async (path, body, token, method = 'POST') => {
  const r = await fetch(B + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body) });
  return r.json();
};
(async () => {
  const env = require('C:/Users/abuhe/Desktop/my projects/M63m.my/src/config/env');
  if (env.isProd || !/localhost/.test(env.DATABASE_URL)) throw new Error('local DB only');
  const removed = await m.User.destroy({ where: { email: { [Op.like]: '%@test.sa' } } });
  await m.Consultation.destroy({ where: {} });
  await m.ConsultantSlot.update({ is_booked: false }, { where: {} });
  await m.MarketplaceItem.update({ status: 'ACTIVE' }, { where: {} });
  console.log('removed test users', removed);

  const pw = 'M63m@demo2026';
  const login = async (email) => (await post('/api/v1/auth/login', { email, password: pw })).token;
  const owner = await login('owner@m63m.my');
  const consultant = await login('consultant@m63m.my');
  const cons = (await (await fetch(B + '/api/v1/consultations/consultants')).json()).data;
  const khaled = cons.find((c) => c.full_name === 'خالد المنصور');
  const sara = cons.find((c) => c.full_name === 'سارة العتيبي');
  const slotsK = (await (await fetch(`${B}/api/v1/consultations/consultants/${khaled.id}/slots`)).json()).data.slots;
  const slotsS = (await (await fetch(`${B}/api/v1/consultations/consultants/${sara.id}/slots`)).json()).data.slots;
  const b1 = await post('/api/v1/consultations/book', { consultant_id: khaled.id, slot_id: slotsK[0].id, topic: 'خطة تقليل الهدر وضبط تكلفة الطعام', notes: 'مطعم وجبات سريعة بثلاثة فروع في الرياض، نسبة الهدر تقارب 9%.' }, owner);
  await post('/api/v1/consultations/book', { consultant_id: sara.id, slot_id: slotsS[2].id, topic: 'اختيار معدات القهوة لفرع جديد' }, owner);
  const b3 = await post('/api/v1/consultations/book', { consultant_id: khaled.id, slot_id: slotsK[4].id, topic: 'هندسة قائمة الطعام وتسعير الأطباق' }, owner);
  await post(`/api/v1/consultations/${b3.consultation_id}/status`, { status: 'IN_PROGRESS' }, consultant, 'PATCH');
  await post(`/api/v1/consultations/${b3.consultation_id}/status`, { status: 'COMPLETED' }, consultant, 'PATCH');
  console.log('demo bookings', b1.status, 'ok');
  await m.sequelize.close();
})().catch((e) => { console.error(e); process.exit(1); });
