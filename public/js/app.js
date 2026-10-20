/* m63m.my — progressive enhancement for server-rendered pages. No framework, no inline scripts (CSP). */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // ---------- Toast ----------
  var toastTimer;
  function toast(message) {
    var el = $('[data-toast]');
    if (!el) return;
    $('span', el).textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 3200);
  }

  // ---------- API helper ----------
  function api(url, options) {
    options = options || {};
    return fetch(url, {
      method: options.method || 'GET',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: options.body ? JSON.stringify(options.body) : undefined,
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var err = new Error(data.message || 'تعذّر إكمال الطلب');
          err.status = res.status;
          err.errors = data.errors || [];
          throw err;
        }
        return data;
      });
    });
  }

  // ---------- Form serialisation ----------
  // Supports "a.b" for nested objects, "x[]" for arrays, and skips fields inside hidden sections.
  function serialize(form) {
    var out = {};
    $$('input, select, textarea', form).forEach(function (field) {
      if (!field.name || field.disabled || field.closest('[hidden]')) return;
      if ((field.type === 'checkbox' || field.type === 'radio') && !field.checked) return;
      var value = field.value.trim();
      if (value === '') return;
      if (field.type === 'number' || field.hasAttribute('data-number')) value = Number(value);

      var name = field.name;
      if (name.slice(-2) === '[]') {
        name = name.slice(0, -2);
        (out[name] = out[name] || []).push(value);
      } else if (name.indexOf('.') > -1) {
        var parts = name.split('.');
        out[parts[0]] = out[parts[0]] || {};
        out[parts[0]][parts[1]] = value;
      } else {
        out[name] = value;
      }
    });
    // Radio groups can live outside the form (form="id" attribute).
    if (form.id) {
      $$('input[form="' + form.id + '"]:checked').forEach(function (f) { out[f.name] = f.value; });
    }
    return out;
  }

  function clearErrors(form) {
    $$('[data-error-for]', form).forEach(function (el) { el.textContent = ''; });
    $$('.is-invalid', form).forEach(function (el) { el.classList.remove('is-invalid'); });
    var alert = $('[data-form-alert]', form);
    if (alert) { alert.hidden = true; alert.textContent = ''; }
  }

  function showErrors(form, err) {
    var alert = $('[data-form-alert]', form);
    var unplaced = [];
    (err.errors || []).forEach(function (e) {
      var slot = $('[data-error-for="' + e.field + '"]', form);
      var input = form.elements[e.field];
      if (slot) {
        slot.textContent = e.message;
        if (input && input.classList) input.classList.add('is-invalid');
      } else {
        unplaced.push(e.message);
      }
    });
    if (alert) {
      alert.textContent = unplaced.length ? err.message + ': ' + unplaced.join('، ') : err.message;
      alert.hidden = false;
      alert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function setLoading(form, loading) {
    var btn = $('button[type="submit"]', form);
    if (btn) btn.classList.toggle('is-loading', loading);
  }

  $$('form[data-api-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var loginUrl = form.getAttribute('data-requires-login');
      if (loginUrl) { window.location.href = loginUrl; return; }

      clearErrors(form);
      var body = form.hasAttribute('data-slots-form') ? serializeSlots(form) : serialize(form);
      setLoading(form, true);

      api(form.getAttribute('data-api-form'), { method: 'POST', body: body })
        .then(function (res) {
          if (form.hasAttribute('data-reload')) {
            toast(res.message || 'تم الحفظ');
            setTimeout(function () { window.location.reload(); }, 700);
            return;
          }
          var target = form.getAttribute('data-redirect') || '/';
          var id = (res.data && res.data.id) || res.consultation_id || '';
          window.location.href = target.replace('{id}', id);
        })
        .catch(function (err) {
          if (err.status === 401 && !/\/auth\//.test(form.getAttribute('data-api-form'))) {
            window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
            return;
          }
          showErrors(form, err);
          setLoading(form, false);
        });
    });
  });

  // ---------- Logout ----------
  $$('[data-logout]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      api('/api/v1/auth/logout', { method: 'POST' }).finally(function () { window.location.href = '/'; });
    });
  });

  // ---------- Mobile nav ----------
  var navToggle = $('[data-nav-toggle]');
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var nav = $('#site-nav');
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  // ---------- New listing: category-specific fields ----------
  function syncCategory() {
    var checked = $('[data-category-input]:checked');
    if (!checked) return;
    $$('[data-meta-for]').forEach(function (section) {
      section.hidden = section.getAttribute('data-meta-for') !== checked.value;
    });
  }
  $$('[data-category-input]').forEach(function (input) { input.addEventListener('change', syncCategory); });
  syncCategory();

  // ---------- Register: consultant bio ----------
  $$('input[name="role"]').forEach(function (input) {
    input.addEventListener('change', function () {
      var bio = $('[data-consultant-only]');
      if (bio) bio.hidden = input.value !== 'CONSULTANT';
    });
  });

  // ---------- Booking: selected slot summary ----------
  $$('[data-slot-input]').forEach(function (input) {
    input.addEventListener('change', function () {
      $('[data-slot-summary-label]').textContent = input.getAttribute('data-slot-label');
      $('[data-slot-summary-price]').textContent = input.getAttribute('data-slot-price');
      var err = $('[data-error-for="slot_id"]');
      if (err) err.textContent = '';
      var topic = $('#topic');
      if (topic && window.matchMedia('(max-width: 1024px)').matches) topic.focus();
    });
  });

  // ---------- Consultant: availability rows ----------
  var rowsHost = $('[data-slot-rows]');
  if (rowsHost) {
    var template = $('[data-slot-row]', rowsHost).cloneNode(true);
    $('[data-add-slot]').addEventListener('click', function () {
      var row = template.cloneNode(true);
      $$('input', row).forEach(function (i) { i.value = ''; });
      var last = $$('[data-slot-row]', rowsHost).pop();
      if (last) {
        // Convenience: next slot starts where the previous one ended, same length and price.
        var prevStart = $('[data-slot-field="start_time"]', last).value;
        var prevEnd = $('[data-slot-field="end_time"]', last).value;
        if (prevStart && prevEnd) {
          var len = new Date(prevEnd) - new Date(prevStart);
          $('[data-slot-field="start_time"]', row).value = prevEnd;
          $('[data-slot-field="end_time"]', row).value = toLocalInput(new Date(new Date(prevEnd).getTime() + len));
        }
        $('[data-slot-field="price"]', row).value = $('[data-slot-field="price"]', last).value;
      }
      rowsHost.appendChild(row);
    });
    rowsHost.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-remove-slot]');
      if (!btn) return;
      if ($$('[data-slot-row]', rowsHost).length > 1) btn.closest('[data-slot-row]').remove();
    });
  }

  function toLocalInput(d) {
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function serializeSlots(form) {
    return {
      slots: $$('[data-slot-row]', form).map(function (row) {
        var get = function (k) { return $('[data-slot-field="' + k + '"]', row).value; };
        return {
          // datetime-local is wall-clock time in the browser's zone; send as absolute ISO.
          start_time: get('start_time') ? new Date(get('start_time')).toISOString() : '',
          end_time: get('end_time') ? new Date(get('end_time')).toISOString() : '',
          price: get('price') === '' ? '' : Number(get('price')),
        };
      }),
    };
  }

  // ---------- Status actions ----------
  function bindStatus(selector, urlFor, attr) {
    $$(selector).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var confirmText = btn.getAttribute('data-confirm');
        if (confirmText && !window.confirm(confirmText)) return;
        btn.classList.add('is-loading');
        api(urlFor(btn), { method: 'PATCH', body: { status: btn.getAttribute(attr) } })
          .then(function (res) {
            toast(res.message || 'تم التحديث');
            setTimeout(function () { window.location.reload(); }, 600);
          })
          .catch(function (err) {
            btn.classList.remove('is-loading');
            toast(err.message);
          });
      });
    });
  }
  bindStatus('[data-consultation-status]', function (b) { return '/api/v1/consultations/' + b.getAttribute('data-id') + '/status'; }, 'data-consultation-status');
  bindStatus('[data-item-status]', function (b) { return '/api/v1/marketplace/items/' + b.getAttribute('data-item-id') + '/status'; }, 'data-item-status');

  // ---------- Tabs ----------
  $$('[data-tab]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var host = tab.closest('.panel');
      $$('[data-tab]', host).forEach(function (t) { t.classList.toggle('is-active', t === tab); });
      $$('[data-tab-panel]', host).forEach(function (p) { p.hidden = p.getAttribute('data-tab-panel') !== tab.getAttribute('data-tab'); });
    });
  });

  // ---------- Copy link ----------
  $$('[data-copy-link]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var url = a.href;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
        .then(function () { toast('تم نسخ الرابط'); })
        .catch(function () { window.prompt('انسخ الرابط:', url); });
    });
  });

  // ---------- Flash from query string ----------
  var params = new URLSearchParams(window.location.search);
  $$('[data-flash]').forEach(function (el) {
    if (params.has(el.getAttribute('data-flash'))) el.hidden = false;
  });

  // ---------- Countdown ----------
  var cd = $('[data-countdown]');
  if (cd) {
    var target = new Date(cd.getAttribute('data-countdown')).getTime();
    var tick = function () {
      var s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      var d = Math.floor(s / 86400);
      var h = Math.floor((s % 86400) / 3600);
      var m = Math.floor((s % 3600) / 60);
      var pad = function (n) { return String(n).padStart(2, '0'); };
      cd.textContent = (d ? d + 'd ' : '') + pad(h) + ':' + pad(m) + ':' + pad(s % 60);
    };
    tick();
    setInterval(tick, 1000);
  }
})();
