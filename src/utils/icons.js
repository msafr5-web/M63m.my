'use strict';

/**
 * Line icon set (24px grid, 1.6 stroke, currentColor). Rendered inline so icons inherit
 * text color and need no extra requests. Use in views: <%- icon('chef') %>.
 */
const PATHS = {
  chef: '<path d="M7 14.5V20h10v-5.5"/><path d="M7 14.5a4 4 0 0 1-1.2-7.8A4.5 4.5 0 0 1 12 3.5a4.5 4.5 0 0 1 6.2 3.2A4 4 0 0 1 17 14.5Z"/><path d="M7 17h10"/>',
  equipment: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M3.5 9h17"/><circle cx="12" cy="14.5" r="3"/><path d="M7 6.5h.01M10 6.5h.01"/>',
  supplies: '<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5Z"/><path d="m4 8.5 8 4.5 8-4.5M12 13v7"/><path d="m8 6.2 8 4.6"/>',
  services: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8V20h3.2l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4Z"/>',
  coffee: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5c0 1 .8 1.3.8 2.3S8 7 8 7M12 3.5c0 1 .8 1.3.8 2.3S12 7 12 7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  pin: '<path d="M12 21s-6.5-5.4-6.5-11a6.5 6.5 0 0 1 13 0c0 5.6-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  arrow: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  'arrow-back': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  'check-circle': '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  share: '<circle cx="17.5" cy="5.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/><path d="m8.7 10.7 6.6-3.9M8.7 13.3l6.6 3.9"/>',
  logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  chat: '<path d="M20 12a7.5 7.5 0 0 1-11 6.6L4 20l1.4-4.6A7.5 7.5 0 1 1 20 12Z"/><path d="M9 11h.01M12 11h.01M15 11h.01"/>',
  video: '<rect x="3" y="6.5" width="12.5" height="11" rx="2"/><path d="m15.5 10.5 5.5-3v9l-5.5-3"/>',
  shield: '<path d="M12 3.5 5 6v5.5c0 4.3 3 7.8 7 9 4-1.2 7-4.7 7-9V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  coins: '<ellipse cx="9" cy="7" rx="5.5" ry="2.5"/><path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7"/><path d="M9.5 16.4c.6.1 1.2.1 1.5.1 3 0 5.5-1.1 5.5-2.5"/><path d="M14.5 10.6c3.4.3 6 1.3 6 2.4v4c0 1.4-2.5 2.5-5.5 2.5s-5.5-1.1-5.5-2.5v-1"/>',
  phone: '<path d="M5 4h3.5l1.5 4-2 1.5a10 10 0 0 0 6.5 6.5L16 14l4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  spark: '<path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l2.6 2.6M15.4 15.4 18 18M6 18l2.6-2.6M15.4 8.6 18 6"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17"/>',
  layers: '<path d="m12 4 8.5 4.5L12 13 3.5 8.5Z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5"/>',
  inbox: '<path d="M3.5 13.5 6 5.5h12l2.5 8V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18Z"/><path d="M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5"/>',
  x_brand: '<path d="M4.5 4.5h4l11 15h-4Z"/><path d="M19 4.5 13.4 10.6M10.6 13.4 5 19.5"/>',
  facebook: '<path d="M14.5 8H16V4.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4 1.5-4 4.2V11H7v3.6h2.5v5.9h3.4v-5.9h2.6L16 11h-3.1V9c0-.7.3-1 1.6-1Z"/>',
  tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.5 2.6 2.4 4.3 5 4.5"/>',
  snapchat: '<path d="M12 4c2.8 0 4.6 2.2 4.6 4.8v2.4l1.7-.5c.6.6.3 1.3-.9 1.8.5 1.6 1.7 2.9 3.1 3.3-.3.9-1.6 1.1-2.6 1.2-.2.7-.3 1.1-.9 1.1-.7 0-1.7-.5-3-.1-1 .3-1.5 1.5-2 1.5s-1-1.2-2-1.5c-1.3-.4-2.3.1-3 .1-.6 0-.7-.4-.9-1.1-1-.1-2.3-.3-2.6-1.2 1.4-.4 2.6-1.7 3.1-3.3-1.2-.5-1.5-1.2-.9-1.8l1.7.5V8.8C7.4 6.2 9.2 4 12 4Z"/>',
};

function icon(name, className = '') {
  const body = PATHS[name];
  if (!body) return '';
  const cls = className ? `icon ${className}` : 'icon';
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

module.exports = { icon, ICON_NAMES: Object.keys(PATHS) };
