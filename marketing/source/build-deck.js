// Builds the client presentation (16:9, RTL Arabic) with pptxgenjs, in the site's brand.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pptxgen = require('pptxgenjs');
const { icon } = require('./brand');
const { applyTheme } = require('C:/Users/abuhe/.claude/skills/synced/4d6cb947-5f98-406a-80a5-90565f37f768_1b8a9763-45df-4e35-ab46-c562a784b83f/pptx/scripts/apply_theme.js');

const ROOT = 'C:/Users/abuhe/Desktop/my projects/M63m.my/marketing';
const OUT = `${ROOT}/m63m-presentation.pptx`;
const asset = (f) => `${ROOT}/assets/${f}`;
const URL_TEXT = 'm63m-my.vercel.app';

const THEME = {
  name: 'Mat3am Roast & Gold',
  headFontFace: 'Tajawal',
  bodyFontFace: 'Tajawal',
  colors: {
    dk1: '1B1816', lt1: 'FFFFFF', dk2: '2C2C2C', lt2: 'FBF9F5',
    accent1: 'C5A059', accent2: '8F6F33', accent3: '4A6B5B', accent4: '9E473C', accent5: 'D4B87A', accent6: '5B5550',
    hlink: '8F6F33', folHlink: '5B5550',
  },
};
const HEX = { roast800: '221F1E', roast700: '2E2A27', roast300: 'A39890', gold50: 'FAF5EA', gold100: 'F5ECD9', gold300: 'E6D3A8', line: 'E9E2D6', cream: 'EFE9DF', sage50: 'E9F0EC', terra50: 'F6E9E6', softInk: 'CBC1B5' };

const W = 13.333, H = 7.5, M = 0.6;
const RTL = { rtlMode: true, align: 'right', lang: 'ar-SA' };

async function iconPng(name, color, px = 256) {
  const svg = icon(name).replace('stroke="currentColor"', `stroke="#${color}"`).replace('<svg ', `<svg width="${px}" height="${px}" `);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.rtlMode = true;
  pres.title = 'منصة مطعم m63m.my — العرض التعريفي';
  pres.author = 'مطعم m63m.my';
  pres.company = 'm63m.my';
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  const ICON = {};
  for (const n of ['chat', 'layers', 'share', 'coffee', 'briefcase', 'shield', 'chef', 'equipment', 'supplies', 'services', 'calendar', 'check-circle', 'search', 'clock', 'user', 'inbox', 'x']) {
    ICON[n] = { gold: await iconPng(n, '8F6F33'), light: await iconPng(n, 'D4B87A'), sage: await iconPng(n, '4A6B5B') };
  }
  const logoDark = asset('../logo/logo-on-dark.png');
  const logoLight = asset('../logo/logo-on-light.png');
  const qrPng = await sharp(Buffer.from(fs.readFileSync(path.join(__dirname, 'qr.svg'), 'utf8').replace('<svg ', '<svg width="600" height="600" '))).png().toBuffer();
  const QR = 'image/png;base64,' + qrPng.toString('base64');
  const logoRatio = 1448 / 576; // logo PNG aspect

  // ---------- Layouts ----------
  const titlePh = (color) => ({ placeholder: { options: { name: 'title', type: 'title', x: M, y: 0.55, w: W - 2 * M, h: 0.9, fontSize: 34, bold: true, color, valign: 'middle', margin: 0, ...RTL }, text: '' } });
  pres.defineSlideMaster({
    title: 'CONTENT_LIGHT',
    background: { color: 'FBF9F5' },
    objects: [
      titlePh('1B1816'),
      { line: { x: M, y: H - 0.62, w: W - 2 * M, h: 0, line: { color: HEX.line, width: 0.75 } } },
      { image: { path: logoLight, x: W - M - 0.42 * logoRatio, y: H - 0.52, w: 0.42 * logoRatio, h: 0.42 } },
      { text: { text: URL_TEXT, options: { x: W - M - 0.42 * logoRatio - 2.6, y: H - 0.5, w: 2.4, h: 0.36, fontSize: 10, color: '5B5550', align: 'right', margin: 0 } } },
    ],
    slideNumber: { x: M, y: H - 0.5, w: 0.6, h: 0.36, fontSize: 10, bold: true, color: '1B1816', align: 'left' },
  });
  pres.defineSlideMaster({
    title: 'DARK',
    background: { color: '1B1816' },
    objects: [titlePh('FFFFFF')],
  });

  // ---------- helpers ----------
  const tile = (s, iconName, x, y, size = 0.62, dark = false) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: size, h: size, rectRadius: 0.14, fill: { color: dark ? '1B1816' : HEX.gold50 }, line: { color: dark ? '1B1816' : HEX.gold100, width: 0.75 }, objectName: `tile-${iconName}` });
    const p = size * 0.25;
    s.addImage({ data: dark ? ICON[iconName].light : ICON[iconName].gold, x: x + p, y: y + p, w: size - 2 * p, h: size - 2 * p, altText: iconName });
  };
  const card = (s, x, y, w, h, name, fill = 'FFFFFF') =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.16, fill: { color: fill }, line: { color: HEX.line, width: 0.75 }, shadow: { type: 'outer', color: '1B1816', opacity: 0.08, blur: 10, offset: 3, angle: 90 }, objectName: name });
  const text = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, fontFace: 'Tajawal', ...RTL, ...o });
  const kicker = (s, t, y = 0.32, dark = false) => text(s, t, { x: M, y, w: W - 2 * M, h: 0.3, fontSize: 12, bold: true, color: dark ? 'D4B87A' : '8F6F33' });
  const browser = (s, img, x, y, w, imgRatio, name) => {
    const bar = 0.26, h = w / imgRatio + bar;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: HEX.roast800 }, line: { color: HEX.roast700, width: 0.75 }, shadow: { type: 'outer', color: '1B1816', opacity: 0.28, blur: 18, offset: 6, angle: 90 }, objectName: `${name}-frame` });
    [0, 1, 2].forEach((i) => s.addShape(pres.shapes.OVAL, { x: x + w - 0.22 - i * 0.14, y: y + 0.09, w: 0.08, h: 0.08, fill: { color: '4A4440' }, line: { color: '4A4440', width: 0 } }));
    s.addImage({ path: asset(img), x: x + 0.02, y: y + bar, w: w - 0.04, h: h - bar - 0.02, altText: name });
    return h;
  };
  const pattern = async () => {
    // Najdi triangle pattern as a translucent PNG overlay
    let paths = '';
    for (let yy = 0; yy < 760; yy += 28) for (let xx = 0; xx < 1340; xx += 48) paths += `<path d="M${xx} ${yy + 28} ${xx + 12} ${yy + 4}l12 24M${xx + 24} ${yy + 28} ${xx + 36} ${yy + 4}l12 24"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1333" height="750"><defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="m"><rect width="1333" height="750" fill="url(#f)"/></mask><radialGradient id="g" cx="0.85" cy="0" r="0.6"><stop offset="0" stop-color="#c5a059" stop-opacity=".28"/><stop offset="1" stop-color="#c5a059" stop-opacity="0"/></radialGradient></defs><rect width="1333" height="750" fill="url(#g)"/><g mask="url(#m)" fill="none" stroke="#c5a059" stroke-opacity=".16">${paths}</g></svg>`;
    return 'image/png;base64,' + (await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64');
  };
  const PATTERN = await pattern();

  // ---------- 1. Cover ----------
  pres.addSection({ title: 'المقدمة' });
  let s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'المقدمة' });
  s.addImage({ data: PATTERN, x: 0, y: 0, w: W, h: H, altText: 'pattern' });
  s.addImage({ path: logoDark, x: W - M - 0.7 * logoRatio, y: 0.55, w: 0.7 * logoRatio, h: 0.7 });
  text(s, 'العرض التعريفي للمنصة', { x: 6.3, y: 1.75, w: W - M - 6.3, h: 0.35, fontSize: 14, bold: true, color: 'D4B87A' });
  text(s, [{ text: 'كل ما يحتاجه مطعمك', options: { breakLine: true } }, { text: 'في ', options: {} }, { text: 'مكان واحد', options: { color: 'C5A059' } }], { x: 6.3, y: 2.2, w: W - M - 6.3, h: 1.75, fontSize: 40, bold: true, color: 'FFFFFF', valign: 'top', lineSpacingMultiple: 0.95 });
  text(s, 'منصة سعودية متخصصة تجمع أصحاب المطاعم والمقاهي بالمستشارين الخبراء والموردين والباحثين عن عمل، بطريقة منظّمة وقابلة للبحث.', { x: 6.3, y: 4.0, w: W - M - 6.3, h: 1.1, fontSize: 16, color: HEX.softInk, valign: 'top' });
  text(s, URL_TEXT, { x: 6.3, y: 6.35, w: W - M - 6.3, h: 0.4, fontSize: 16, bold: true, color: 'D4B87A', rtlMode: false, lang: 'en-US', align: 'right' });
  browser(s, 'marketplace.png', M, 1.9, 5.35, 1440 / 900, 'cover-shot');
  s.addNotes('رحّب بالحضور وقدّم منصة «مطعم»: منصة واحدة لقطاع المطاعم والمقاهي في السعودية تجمع الاستشارات والوظائف والمعدات والموردين.');

  // ---------- 2. Problem -> solution ----------
  s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'المقدمة' });
  kicker(s, 'لماذا مطعم؟');
  s.addText('من قنوات متفرقة إلى منصة واحدة منظّمة', { placeholder: 'title' });
  const colW = (W - 2 * M - 0.5) / 2;
  const before = ['الفرص والوظائف تضيع بين عشرات الرسائل', 'لا بحث ولا تصنيف حسب نوع الطلب', 'التواصل مع الخبير يعتمد على المعارف', 'لا سجل للاستشارات والطلبات السابقة'];
  const after = ['أربعة أقسام متخصصة مع بحث وتصفية', 'حقول خاصة بكل قسم: الراتب، الحالة، الكمية', 'حجز مباشر من جدول المستشار المعتمد', 'لوحة تحكم تحفظ جلساتك وطلباتك'];
  const col = (x, title, items, good) => {
    card(s, x, 1.75, colW, 4.4, `col-${good ? 'after' : 'before'}`, good ? 'FFFFFF' : 'F4F0E8');
    tile(s, good ? 'check-circle' : 'inbox', x + colW - 0.95, 2.05, 0.62, good);
    text(s, title, { x: x + 0.35, y: 2.12, w: colW - 1.5, h: 0.5, fontSize: 22, bold: true, color: '1B1816' });
    items.forEach((t, i) => {
      const y = 3.0 + i * 0.78;
      s.addImage({ data: good ? ICON['check-circle'].sage : ICON.x.gold, x: x + colW - 0.72, y: y + 0.06, w: 0.3, h: 0.3 });
      text(s, t, { x: x + 0.35, y, w: colW - 1.2, h: 0.42, fontSize: 16, color: good ? '2C2C2C' : '5B5550', valign: 'middle' });
    });
  };
  col(W - M - colW, 'اليوم: قنوات واتساب متفرقة', before, false);
  col(M, 'مع مطعم: كل شيء في مكانه', after, true);
  s.addNotes('اشرح المشكلة: أهل القطاع يعتمدون على قنوات واتساب متفرقة تضيع فيها الفرص. مطعم تحافظ على روح هذه القنوات لكن بتنظيم وبحث وحجز مباشر.');

  // ---------- 3. Three services ----------
  pres.addSection({ title: 'المنصة' });
  s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'المنصة' });
  kicker(s, 'ماذا تقدم المنصة');
  s.addText('ثلاث خدمات في منصة واحدة', { placeholder: 'title' });
  const svcs = [
    ['chat', 'استشارات الخبراء', 'احجز جلسة مع مستشار معتمد في التشغيل وتقليل الهدر والتسعير وافتتاح الفروع، مباشرة من جدول مواعيده.'],
    ['layers', 'سوق الطلبات', 'انشر طلبك أو تصفّح طلبات غيرك في أربعة أقسام: الوظائف، المعدات، الموردون، والخدمات المساندة.'],
    ['share', 'انتشار أوسع', 'شارك طلبك بضغطة على X وفيسبوك وواتساب. النشر التلقائي على حسابات المنصة قريباً.'],
  ];
  const cw = (W - 2 * M - 2 * 0.35) / 3;
  svcs.forEach(([ic, t, d], i) => {
    const x = W - M - cw - i * (cw + 0.35);
    card(s, x, 1.85, cw, 3.75, `svc-${ic}`);
    tile(s, ic, x + cw - 1.05, 2.2, 0.78, true);
    text(s, t, { x: x + 0.35, y: 3.25, w: cw - 0.7, h: 0.55, fontSize: 22, bold: true, color: '1B1816' });
    text(s, d, { x: x + 0.35, y: 3.9, w: cw - 0.7, h: 2.1, fontSize: 15, color: '5B5550', valign: 'top', lineSpacingMultiple: 1.15 });
  });
  s.addNotes('الخدمات الثلاث: الاستشارات، سوق الطلبات، والانتشار على منصات التواصل. نبّه أن النشر التلقائي على حسابات المنصة قيد الإعداد.');

  // ---------- 4. Who it's for ----------
  s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'المنصة' });
  kicker(s, 'لمن المنصة؟');
  s.addText('لكل طرف في القطاع لوحة تحكم تناسبه', { placeholder: 'title' });
  const roles = [
    ['coffee', 'صاحب المنشأة', 'مالك مطعم أو كافيه أو رائد أعمال: يحجز الاستشارات، وينشر طلبات الموظفين والمعدات والتوريد.'],
    ['chat', 'المستشار الخبير', 'يعرض مواعيده وأسعاره، ويستقبل الحجوزات ويدير جلساته بعد اعتماد إدارة المنصة لخبرته.'],
    ['briefcase', 'المورد والباحث عن عمل', 'يعرض المعدات والمنتجات والخدمات، ويتواصل مع أصحاب الوظائف المعلنة مباشرة.'],
    ['shield', 'إدارة المنصة', 'تراجع طلبات انضمام المستشارين وتعتمدها، وتراقب جودة المحتوى المنشور.'],
  ];
  const rw = (W - 2 * M - 0.35) / 2, rh = 2.1;
  roles.forEach(([ic, t, d], i) => {
    const x = i % 2 === 0 ? W - M - rw : M, y = 1.8 + Math.floor(i / 2) * (rh + 0.3);
    card(s, x, y, rw, rh, `role-${ic}`);
    tile(s, ic, x + rw - 0.95, y + 0.35, 0.62);
    text(s, t, { x: x + 0.35, y: y + 0.38, w: rw - 1.5, h: 0.5, fontSize: 20, bold: true, color: '1B1816' });
    text(s, d, { x: x + 0.35, y: y + 0.95, w: rw - 1.5, h: 1.0, fontSize: 14.5, color: '5B5550', valign: 'top' });
  });
  s.addNotes('أنواع الحسابات: صاحب المنشأة، المستشار، المورد/الباحث عن عمل. حساب المدير لا يُسجَّل ذاتياً.');

  // ---------- 5. Marketplace categories ----------
  pres.addSection({ title: 'سوق الطلبات' });
  s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'سوق الطلبات' });
  kicker(s, 'سوق الطلبات');
  s.addText('أربعة أقسام تغطي تشغيل مطعمك', { placeholder: 'title' });
  const cats = [['chef', 'الوظائف', 'طهاة، باريستا، مدراء فروع وطاقم خدمة'], ['equipment', 'الأجهزة والمعدات', 'معدات مطابخ، مكائن قهوة، كاشير وتبريد'], ['supplies', 'المنتجات والموردون', 'مواد غذائية، بن، تغليف ومكونات'], ['services', 'الخدمات المساندة', 'تصميم داخلي، تراخيص حكومية وتسويق']];
  const catW = 4.2, catH = 1.0;
  cats.forEach(([ic, t, d], i) => {
    const x = W - M - catW, y = 1.8 + i * (catH + 0.22);
    card(s, x, y, catW, catH, `cat-${ic}`);
    tile(s, ic, x + catW - 0.82, y + 0.2, 0.6);
    text(s, t, { x: x + 0.25, y: y + 0.14, w: catW - 1.2, h: 0.38, fontSize: 17, bold: true, color: '1B1816' });
    text(s, d, { x: x + 0.25, y: y + 0.53, w: catW - 1.2, h: 0.34, fontSize: 12.5, color: '5B5550' });
  });
  browser(s, 'marketplace.png', M, 1.8, (4.62 - 0.26) * 1.6, 1440 / 900, 'market-shot');
  s.addNotes('كل قسم له حقوله الخاصة: الراتب والخبرة للوظائف، الحالة والعلامة التجارية للمعدات، الحد الأدنى للطلب عند الموردين. البحث يشمل العنوان والوصف.');

  // ---------- 6. How to post ----------
  s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'سوق الطلبات' });
  kicker(s, 'نشر طلب');
  s.addText('انشر طلبك في دقيقة بأربع خطوات', { placeholder: 'title' });
  const steps = [['اختر القسم', 'وظيفة، معدات، توريد أو خدمة'], ['اكتب التفاصيل', 'العنوان والوصف والسعر'], ['أكمل حقول القسم', 'تتغير حسب نوع الطلب'], ['انشر وشارك', 'يظهر فوراً في السوق']];
  const sw = (W - 2 * M - 3 * 0.3) / 4;
  steps.forEach(([t, d], i) => {
    const x = W - M - sw - i * (sw + 0.3);
    card(s, x, 1.75, sw, 1.85, `step-${i + 1}`);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + sw - 0.75, y: 1.98, w: 0.5, h: 0.5, rectRadius: 0.12, fill: { color: '1B1816' }, line: { color: '1B1816', width: 0 } });
    text(s, String(i + 1), { x: x + sw - 0.75, y: 1.98, w: 0.5, h: 0.5, fontSize: 18, bold: true, color: 'D4B87A', align: 'center', valign: 'middle', rtlMode: false, lang: 'en-US' });
    text(s, t, { x: x + 0.25, y: 2.62, w: sw - 0.5, h: 0.4, fontSize: 17, bold: true, color: '1B1816' });
    text(s, d, { x: x + 0.25, y: 3.02, w: sw - 0.5, h: 0.4, fontSize: 13, color: '5B5550' });
  });
  browser(s, 'item.png', M, 3.85, 4.3, 1440 / 900, 'item-shot');
  card(s, M + 4.65, 3.85, W - 2 * M - 4.65, 2.4, 'privacy-callout', HEX.gold50);
  tile(s, 'shield', W - M - 0.95, 4.15, 0.62);
  text(s, 'بيانات التواصل للأعضاء فقط', { x: M + 4.95, y: 4.2, w: W - 2 * M - 6.0, h: 0.45, fontSize: 19, bold: true, color: '1B1816' });
  text(s, 'جوالك وبريدك في صفحة طلبك يظهران للمسجلين فقط، حماية لك من الرسائل المزعجة. وبعد التوظيف أو البيع تغلق طلبك بضغطة، ويبقى في لوحة تحكمك.', { x: M + 4.95, y: 4.75, w: W - 2 * M - 6.0, h: 1.3, fontSize: 14.5, color: '5B5550', valign: 'top' });
  s.addNotes('اعرض خطوات النشر. الطلب يظهر في السوق فوراً، ويمكن إغلاقه وإعادة تفعيله من صفحته. بيانات التواصل لا تظهر للزوار.');

  // ---------- 7. Consultations booking ----------
  pres.addSection({ title: 'الاستشارات' });
  s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'الاستشارات' });
  kicker(s, 'استشارات الخبراء');
  s.addText('اسأل من جرّب قبلك، واحجز موعدك مباشرة', { placeholder: 'title' });
  const bsteps = [['اختر المستشار', 'بطاقته تعرض المواعيد المتاحة والسعر وأقرب موعد'], ['حدّد الموعد', 'المواعيد مرتبة حسب اليوم وبتوقيت الرياض'], ['اكتب موضوعك', 'مثل «تقليل الهدر في مطعم وجبات سريعة»'], ['أكّد الحجز', 'يُثبت فوراً وتجد رابط الجلسة في لوحتك']];
  const bx = W - M - 5.6;
  bsteps.forEach(([t, d], i) => {
    const y = 1.85 + i * 1.12;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: W - M - 0.55, y, w: 0.55, h: 0.55, rectRadius: 0.13, fill: { color: '1B1816' }, line: { color: '1B1816', width: 0 }, objectName: `bstep-${i + 1}` });
    text(s, String(i + 1), { x: W - M - 0.55, y, w: 0.55, h: 0.55, fontSize: 18, bold: true, color: 'D4B87A', align: 'center', valign: 'middle', rtlMode: false, lang: 'en-US' });
    if (i < bsteps.length - 1) s.addShape(pres.shapes.LINE, { x: W - M - 0.275, y: y + 0.62, w: 0, h: 0.45, line: { color: HEX.line, width: 1 } });
    text(s, t, { x: bx, y: y - 0.02, w: 4.85, h: 0.36, fontSize: 18, bold: true, color: '1B1816' });
    text(s, d, { x: bx, y: y + 0.36, w: 4.85, h: 0.36, fontSize: 13.5, color: '5B5550' });
  });
  browser(s, 'consultant.png', M + 0.4, 1.75, (4.95 - 0.26) * (1180 / 1060), 1180 / 1060, 'consultant-shot');
  s.addNotes('خطوات الحجز الأربع. الموعد يُثبت فور التأكيد دون انتظار موافقة، والجلسة تظهر في لوحة التحكم مع رابطها.');

  // ---------- 8. Session journey ----------
  s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'الاستشارات' });
  kicker(s, 'رحلة الجلسة');
  s.addText('الجلسة تتقدم باتجاه واحد، وموعدك محفوظ لك وحدك', { placeholder: 'title' });
  const states = [['مجدولة', 'فور تأكيد الحجز', 'FFFFFF', HEX.line], ['جارية', 'يبدؤها المستشار', 'FFFFFF', HEX.line], ['مكتملة', 'تُحفظ في سجلك', HEX.sage50, '4A6B5B']];
  const stW = 2.9, stH = 1.25, stY = 2.25;
  states.forEach(([t, d, fill, border], i) => {
    const x = W - M - stW - i * (stW + 0.85);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: stY, w: stW, h: stH, rectRadius: 0.16, fill: { color: fill }, line: { color: border, width: i === 2 ? 1.5 : 0.75 }, objectName: `state-${i}` });
    text(s, t, { x, y: stY + 0.2, w: stW, h: 0.5, fontSize: 22, bold: true, color: '1B1816', align: 'center' });
    text(s, d, { x, y: stY + 0.72, w: stW, h: 0.35, fontSize: 13, color: '5B5550', align: 'center' });
    if (i < 2) s.addShape(pres.shapes.LINE, { x: x - 0.75, y: stY + stH / 2, w: 0.65, h: 0, line: { color: '8F6F33', width: 1.5, endArrowType: 'triangle' }, flipH: true });
  });
  // cancelled branch
  const cx = W - M - stW - (stW + 0.85);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: 4.35, w: stW, h: stH, rectRadius: 0.16, fill: { color: HEX.terra50 }, line: { color: '9E473C', width: 1.5 }, objectName: 'state-cancelled' });
  text(s, 'ملغاة', { x: cx, y: 4.55, w: stW, h: 0.5, fontSize: 22, bold: true, color: '1B1816', align: 'center' });
  text(s, 'يعود الموعد متاحاً للحجز', { x: cx, y: 5.07, w: stW, h: 0.35, fontSize: 13, color: '5B5550', align: 'center' });
  s.addShape(pres.shapes.LINE, { x: cx + stW / 2, y: stY + stH + 0.08, w: 0, h: 4.35 - stY - stH - 0.16, line: { color: '9E473C', width: 1.25, dashType: 'dash', endArrowType: 'triangle' } });
  text(s, 'إلغاء من أي طرف', { x: cx + stW / 2 + 0.15, y: 3.75, w: 2.2, h: 0.35, fontSize: 12, color: '9E473C', align: 'left', rtlMode: true });
  card(s, M + 1.73, 4.35, 3.6, 1.25, 'double-booking', HEX.gold50);
  text(s, 'لا حجز مزدوج أبداً', { x: M + 1.98, y: 4.5, w: 3.1, h: 0.38, fontSize: 16, bold: true, color: '1B1816' });
  text(s, 'حتى لو حاول شخصان حجز الموعد نفسه في اللحظة ذاتها، ينجح واحد فقط.', { x: M + 1.98, y: 4.9, w: 3.1, h: 0.6, fontSize: 13, color: '5B5550', valign: 'top' });
  s.addNotes('المستشار وحده يبدأ الجلسة وينهيها، والطرفان يستطيعان الإلغاء قبل الاكتمال. الإلغاء يعيد الموعد متاحاً. الجلسة المكتملة أو الملغاة لا تعود لحالة سابقة.');

  // ---------- 9. For consultants ----------
  s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'الاستشارات' });
  kicker(s, 'للمستشارين');
  s.addText('خبرتك تستحق منصة تعرضها باحتراف', { placeholder: 'title' });
  const cpts = [['shield', 'اعتماد يضمن الجودة', 'تراجع إدارة المنصة نبذة خبرتك وتعتمدها، فيظهر ملفك للعملاء بعلامة «مستشار معتمد».'], ['calendar', 'مواعيدك وأسعارك بيدك', 'أضف حتى خمسين موعداً دفعة واحدة بأسعارها، والمنصة تمنع تداخلها تلقائياً.'], ['check-circle', 'إدارة الجلسات من لوحتك', 'الحجوزات الواردة باسم العميل وموضوعه وملاحظاته، وتبدأ الجلسة وتنهيها بضغطة.']];
  const pw2 = (W - 2 * M - 2 * 0.35) / 3;
  cpts.forEach(([ic, t, d], i) => {
    const x = W - M - pw2 - i * (pw2 + 0.35);
    card(s, x, 1.9, pw2, 3.4, `cons-${ic}`);
    tile(s, ic, x + pw2 - 1.0, 2.25, 0.7, i === 0);
    text(s, t, { x: x + 0.35, y: 3.2, w: pw2 - 0.7, h: 0.55, fontSize: 20, bold: true, color: '1B1816' });
    text(s, d, { x: x + 0.35, y: 3.85, w: pw2 - 0.7, h: 1.7, fontSize: 14.5, color: '5B5550', valign: 'top', lineSpacingMultiple: 1.15 });
  });
  s.addNotes('موجّهة للمستشارين: الاعتماد، إدارة المواعيد والأسعار، وإدارة الجلسات من لوحة التحكم.');

  // ---------- 10. Dashboard ----------
  pres.addSection({ title: 'التجربة' });
  s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'التجربة' });
  kicker(s, 'لوحة التحكم');
  s.addText('كل شيء أمامك في لوحة واحدة', { placeholder: 'title' });
  browser(s, 'dashboard.png', M, 1.75, 8.0, 1440 / 820, 'dashboard-shot');
  const dpts = [['calendar', 'جلساتك القادمة والسابقة'], ['clock', 'جلسات اليوم بنظرة'], ['layers', 'طلباتك في السوق وحالتها'], ['check-circle', 'أرقامك المهمة في الأعلى']];
  dpts.forEach(([ic, t], i) => {
    const y = 1.95 + i * 1.08;
    tile(s, ic, W - M - 0.62, y, 0.62);
    text(s, t, { x: M + 8.35, y: y + 0.08, w: W - 2 * M - 8.35 - 0.85, h: 0.48, fontSize: 16, bold: true, color: '1B1816', valign: 'middle' });
  });
  s.addNotes('لوحة التحكم تتكيف مع نوع الحساب: صاحب المنشأة يرى استشاراته وطلباته، والمستشار يرى الحجوزات الواردة ولوحة إضافة المواعيد.');

  // ---------- 11. Mobile + privacy ----------
  s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'التجربة' });
  kicker(s, 'على جوالك وبأمان');
  s.addText('تعمل على الجوال، وتحمي بياناتك', { placeholder: 'title' });
  const phW = 2.35, phH = phW * (844 / 390) * 0.86;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.4, y: 1.7, w: phW + 0.16, h: Math.min(phH, 4.95) + 0.16, rectRadius: 0.3, fill: { color: '1B1816' }, line: { color: '1B1816', width: 0 }, shadow: { type: 'outer', color: '1B1816', opacity: 0.3, blur: 16, offset: 6, angle: 90 }, objectName: 'phone' });
  s.addImage({ path: asset('mobile-home.png'), x: M + 0.48, y: 1.78, w: phW, h: Math.min(phH, 4.95), sizing: { type: 'crop', w: phW, h: Math.min(phH, 4.95) }, altText: 'mobile' });
  text(s, 'بدون تطبيق للتحميل', { x: M + 3.6, y: 1.85, w: W - 2 * M - 3.6, h: 0.45, fontSize: 20, bold: true, color: '1B1816' });
  text(s, 'افتح الموقع من أي متصفح، وكل الصفحات تتكيّف مع شاشتك.', { x: M + 3.6, y: 2.35, w: W - 2 * M - 3.6, h: 0.4, fontSize: 15, color: '5B5550' });
  const priv = ['بيانات التواصل للأعضاء المسجلين فقط', 'تفاصيل الجلسة وملاحظاتك لطرفي الجلسة فقط', 'كلمات المرور محفوظة مشفّرة ولا يطّلع عليها أحد', 'اتصال مشفّر دائماً وحماية من تخمين كلمات المرور'];
  priv.forEach((t, i) => {
    const y = 3.15 + i * 0.75;
    card(s, M + 3.6, y, W - 2 * M - 3.6, 0.6, `priv-${i}`);
    s.addImage({ data: ICON['check-circle'].sage, x: W - M - 0.5, y: y + 0.14, w: 0.32, h: 0.32 });
    text(s, t, { x: M + 3.85, y: y + 0.08, w: W - 2 * M - 4.6, h: 0.44, fontSize: 15, color: '2C2C2C', valign: 'middle' });
  });
  s.addNotes('المنصة متجاوبة بالكامل مع الجوال. ركّز على الخصوصية: بيانات التواصل للمسجلين فقط، والجلسات لطرفيها فقط.');

  // ---------- 12. Closing ----------
  pres.addSection({ title: 'الختام' });
  s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'الختام' });
  s.addImage({ data: PATTERN, x: 0, y: 0, w: W, h: H, altText: 'pattern' });
  s.addImage({ path: logoDark, x: W - M - 0.62 * logoRatio, y: 0.55, w: 0.62 * logoRatio, h: 0.62 });
  text(s, [{ text: 'ابدأ الآن، والتسجيل ', options: {} }, { text: 'مجاني', options: { color: 'C5A059' } }], { x: M + 3.6, y: 1.7, w: W - 2 * M - 3.6, h: 0.9, fontSize: 40, bold: true, color: 'FFFFFF' });
  text(s, 'استشارتك القادمة، وموظفك القادم، ومورّدك القادم: كلها على بُعد ضغطة.', { x: M + 3.6, y: 2.65, w: W - 2 * M - 3.6, h: 0.8, fontSize: 16, color: HEX.softInk, valign: 'top' });
  const cs = [['01', 'أنشئ حسابك', 'صاحب منشأة، مستشار، أو مورد وباحث عن عمل'], ['02', 'انشر أو احجز', 'طلبك في قسمه، أو موعد مع مستشار'], ['03', 'تابع من لوحتك', 'جلساتك وطلباتك في مكان واحد']];
  const csW = (W - 2 * M - 3.6 - 2 * 0.3) / 3;
  cs.forEach(([n, t, d], i) => {
    const x = W - M - csW - i * (csW + 0.3);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 3.8, w: csW, h: 2.1, rectRadius: 0.16, fill: { color: 'FFFFFF', transparency: 96 }, line: { color: '6B5A3A', width: 0.75 }, objectName: `close-step-${n}` });
    text(s, n, { x: x + 0.3, y: 4.0, w: csW - 0.6, h: 0.55, fontSize: 28, bold: true, color: 'C5A059', align: 'right', rtlMode: false, lang: 'en-US' });
    text(s, t, { x: x + 0.3, y: 4.6, w: csW - 0.6, h: 0.42, fontSize: 17, bold: true, color: 'FFFFFF' });
    text(s, d, { x: x + 0.3, y: 5.05, w: csW - 0.6, h: 0.7, fontSize: 12.5, color: HEX.softInk, valign: 'top' });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 3.0, w: 2.9, h: 2.9, rectRadius: 0.2, fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF', width: 0 }, objectName: 'qr-card' });
  s.addImage({ data: QR, x: M + 0.25, y: 3.25, w: 2.4, h: 2.4, altText: 'QR code to m63m-my.vercel.app' });
  text(s, URL_TEXT, { x: M, y: 6.15, w: 2.9, h: 0.4, fontSize: 15, bold: true, color: 'D4B87A', align: 'center', rtlMode: false, lang: 'en-US' });
  s.addNotes('اختم بدعوة للتسجيل المجاني. امسح الرمز لفتح المنصة مباشرة.');

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('deck written', fs.statSync(OUT).size);
})().catch((e) => { console.error(e); process.exit(1); });
