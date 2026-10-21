// Screenshots of the local site (demo data) for the brochure and deck.
const puppeteer = require('puppeteer-core');
const OUT = 'C:/Users/abuhe/Desktop/my projects/M63m.my/marketing/assets';
const B = 'http://localhost:3000';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  const shot = async (path, name, { clipH = 900, clipY = 0, wait } = {}) => {
    await page.goto(B + path, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    if (wait) await wait();
    const vw = page.viewport().width;
    await page.screenshot({ path: `${OUT}/${name}.png`, clip: { x: 0, y: clipY, width: vw, height: clipH }, captureBeyondViewport: true });
    console.log('shot', name);
  };

  await shot('/', 'home');
  await shot('/', 'home-sections', { clipY: 830, clipH: 980 });
  await shot('/marketplace', 'marketplace');
  const consultantId = await page.evaluate(async () => (await (await fetch('/api/v1/consultations/consultants')).json()).data.find((c) => c.full_name === 'خالد المنصور').id);
  const itemId = await page.evaluate(async () => (await (await fetch('/api/v1/marketplace/items?category=JOBS')).json()).data[0].id);
  await shot(`/marketplace/${itemId}`, 'item');

  // Signed-in views: log in through the real API so the session cookie is set.
  await page.goto(B + '/login');
  await page.evaluate(async () => fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'owner@m63m.my', password: 'M63m@demo2026' }) }));
  await page.setViewport({ width: 1180, height: 900, deviceScaleFactor: 2 });
  await shot(`/consultations/${consultantId}`, 'consultant', { clipH: 1060,
    wait: async () => {
      await page.click('[data-slot-input] + .choice-body');
      await page.type('#topic', 'خطة تقليل الهدر وضبط تكلفة الطعام');
    },
  });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await shot('/dashboard', 'dashboard', { clipH: 820 });
  await shot('/marketplace/new', 'new-item', { clipH: 1000 });

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 });
  await shot('/', 'mobile-home', { clipH: 844 });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
