// Shared brand bits for the brochure and the deck: palette, fonts, icons, logo markup.
const path = require('path');
const fs = require('fs');
const { icon } = require('C:/Users/abuhe/Desktop/my projects/M63m.my/src/utils/icons.js');

const FONTS = path.join(__dirname, 'fonts').replace(/\\/g, '/');
// Fonts are inlined as data URLs: pages built with setContent cannot read file:// fonts.
const b64 = (f) => `data:font/ttf;base64,${fs.readFileSync(path.join(FONTS, f)).toString('base64')}`;
const fontFaces = `
@font-face{font-family:'Alexandria';src:url('${b64('Alexandria.ttf')}') format('truetype');font-weight:100 900}
@font-face{font-family:'Tajawal';src:url('${b64('Tajawal-Regular.ttf')}') format('truetype');font-weight:400}
@font-face{font-family:'Tajawal';src:url('${b64('Tajawal-Medium.ttf')}') format('truetype');font-weight:500}
@font-face{font-family:'Tajawal';src:url('${b64('Tajawal-Bold.ttf')}') format('truetype');font-weight:700}
@font-face{font-family:'Tajawal';src:url('${b64('Tajawal-ExtraBold.ttf')}') format('truetype');font-weight:800}`;

const C = {
  roast950: '#141110', roast900: '#1b1816', roast800: '#221f1e', roast700: '#2e2a27', roast300: '#a39890',
  gold500: '#c5a059', gold400: '#d4b87a', gold300: '#e6d3a8', gold700: '#8f6f33', gold100: '#f5ecd9', gold50: '#faf5ea',
  alabaster: '#fbf9f5', line: '#e9e2d6', ink: '#2c2c2c', inkSoft: '#5b5550', sage: '#4a6b5b', terracotta: '#9e473c',
};

const pattern = (opacity = 0.16) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='28' viewBox='0 0 48 28'%3E%3Cg fill='none' stroke='%23c5a059' stroke-opacity='${opacity}' stroke-width='1'%3E%3Cpath d='M0 28 12 4l12 24M24 28 36 4l12 24'/%3E%3Cpath d='M6 28 12 16l6 12M30 28l6-12 6 12'/%3E%3C/g%3E%3C/svg%3E")`;

/** Logo lockup. tone: 'dark' = for dark backgrounds (light wordmark), 'light' = for light backgrounds. */
function logo(size = 64, tone = 'dark') {
  const word = tone === 'dark' ? '#ffffff' : C.roast900;
  const sub = tone === 'dark' ? C.gold400 : C.gold700;
  return `<div class="logo" style="display:inline-flex;align-items:center;gap:${size * 0.28}px;direction:rtl">
    <div style="width:${size}px;height:${size}px;border-radius:${size * 0.29}px;display:grid;place-items:center;
      background:linear-gradient(145deg,${C.gold400},${C.gold500} 55%,#a8843f);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 ${size * 0.15}px ${size * 0.4}px -${size * 0.15}px rgba(197,160,89,.6)">
      <span style="font-family:Alexandria;font-weight:700;font-size:${size * 0.56}px;line-height:1;color:${C.roast900};transform:translateY(-${size * 0.04}px)">م</span>
    </div>
    <div style="display:flex;flex-direction:column;line-height:1.05">
      <span style="font-family:Alexandria;font-weight:600;font-size:${size * 0.62}px;color:${word}">مطعم</span>
      <span style="font-family:Alexandria;font-weight:500;font-size:${size * 0.2}px;letter-spacing:.18em;color:${sub};direction:ltr;text-align:right;margin-top:${size * 0.06}px">M63M.MY</span>
    </div></div>`;
}

module.exports = { C, fontFaces, pattern, logo, icon, FONTS };
