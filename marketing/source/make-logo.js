// Renders the logo lockups and the mark to transparent PNGs.
const puppeteer = require('puppeteer-core');
const { fontFaces, logo, C } = require('./brand');
const OUT = 'C:/Users/abuhe/Desktop/my projects/M63m.my/marketing/logo';

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage();
  const render = async (name, body) => {
    await page.setContent(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>${fontFaces}
      html,body{margin:0;background:transparent}#w{display:inline-block;padding:24px}</style></head><body><div id="w">${body}</div></body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const el = await page.$('#w');
    await el.screenshot({ path: `${OUT}/${name}.png`, omitBackground: true });
    console.log('logo', name);
  };
  await page.setViewport({ width: 1200, height: 600, deviceScaleFactor: 4 });
  await render('logo-on-dark', logo(96, 'dark'));
  await render('logo-on-light', logo(96, 'light'));
  await render('mark', `<div style="width:160px;height:160px;border-radius:46px;display:grid;place-items:center;background:linear-gradient(145deg,${C.gold400},${C.gold500} 55%,#a8843f)"><span style="font-family:Alexandria;font-weight:700;font-size:90px;line-height:1;color:${C.roast900};transform:translateY(-6px)">م</span></div>`);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
