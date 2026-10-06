/**
 * InkMark & Seal Co. — main.js
 * Shared behaviour for every public page. Vanilla ES6+, no dependencies
 * except Bootstrap's bundle (for collapse, dropdown, tooltip, offcanvas).
 *
 * Modules (each runs only if its markup is present):
 *   Theme      — dark/light toggle, system preference, localStorage
 *   Direction  — RTL preview toggle (demo)
 *   Reveal     — stamp "impression" on scroll
 *   Tooltips   — Bootstrap tooltips
 *   Forms      — friendly inline validation for every [data-validate] form
 *   Quote      — "Add to quote" list saved in localStorage + offcanvas
 *   Catalog    — product grid render, filter, search, sort, skeletons
 *   Blog       — search + category filter
 *   Product    — product details: gallery, options, quantity, ?id= loading
 *   Countdown  — coming-soon timer
 *   Press      — replay the hero stamp animation
 */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable: ignore */ } }
  };

  /** Announce a short message to screen readers (and show a toast if present). */
  function announce(message) {
    const region = $('#liveRegion');
    if (region) { region.textContent = ''; window.setTimeout(() => { region.textContent = message; }, 60); }
    const toastEl = $('#siteToast');
    if (toastEl && window.bootstrap) {
      $('.toast-body', toastEl).textContent = message;
      window.bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2600 }).show();
    }
  }
  window.InkMark = { announce, store };

  /* ------------------------------------------------------------------ */
  /* Theme                                                              */
  /* ------------------------------------------------------------------ */
  /** Apply a theme ("light" | "dark") and sync toggle buttons. */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    $$('[data-theme-toggle]').forEach((btn) => {
      const dark = theme === 'dark';
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      const icon = $('.bi', btn);
      if (icon) icon.className = dark ? 'bi bi-sun' : 'bi bi-moon-stars';
    });
  }
  function initTheme() {
    const saved = store.get('inkmark-theme', null);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(saved || (media.matches ? 'dark' : 'light'));
    media.addEventListener('change', (e) => { if (!store.get('inkmark-theme', null)) applyTheme(e.matches ? 'dark' : 'light'); });
    $$('[data-theme-toggle]').forEach((btn) => btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      store.set('inkmark-theme', next);
      applyTheme(next);
    }));
  }

  /* ------------------------------------------------------------------ */
  /* Direction (RTL preview)                                            */
  /* ------------------------------------------------------------------ */
  function applyDir(dir) {
    const html = document.documentElement;
    html.setAttribute('dir', dir);
    const bs = $('#bootstrap-css');
    if (bs) {
      const href = bs.getAttribute('href');
      const want = dir === 'rtl' ? href.replace('bootstrap.min.css', 'bootstrap.rtl.min.css') : href.replace('bootstrap.rtl.min.css', 'bootstrap.min.css');
      if (want !== href) { bs.removeAttribute('integrity'); bs.setAttribute('href', want); }
    }
    const rtl = dir === 'rtl';
    $$('[data-dir-toggle]').forEach((b) => {
      b.setAttribute('aria-pressed', String(rtl));
      // Header icon button: label shows the direction it switches to
      const label = $('.dir-label', b);
      if (label) {
        const text = rtl ? 'Switch to left-to-right layout' : 'Switch to right-to-left layout';
        label.textContent = rtl ? 'LTR' : 'RTL';
        b.setAttribute('aria-label', text);
        b.setAttribute('title', text);
      }
    });
  }
  function initDirection() {
    const saved = store.get('inkmark-dir', null);
    applyDir(saved || document.documentElement.getAttribute('dir') || 'ltr');
    $$('[data-dir-toggle]').forEach((btn) => btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl';
      store.set('inkmark-dir', next);
      applyDir(next);
    }));
  }

  /* ------------------------------------------------------------------ */
  /* Reveal ("impression")                                              */
  /* ------------------------------------------------------------------ */
  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------ */
  /* Tooltips                                                           */
  /* ------------------------------------------------------------------ */
  function initTooltips() {
    if (!window.bootstrap) return;
    $$('[data-bs-toggle="tooltip"]').forEach((el) => window.bootstrap.Tooltip.getOrCreateInstance(el));
  }

  /* ------------------------------------------------------------------ */
  /* Forms                                                              */
  /* ------------------------------------------------------------------ */
  const DEFAULT_MSG = {
    valueMissing: 'Please fill in this field.',
    typeMismatch: { email: 'Enter an email address like name@company.com.', url: 'Enter a full web address, starting with https://', tel: 'Enter a phone number with digits only.' },
    patternMismatch: 'This doesn\u2019t match the expected format.',
    tooShort: (el) => `Use at least ${el.minLength} characters.`,
    rangeUnderflow: (el) => `Enter ${el.min} or more.`,
    rangeOverflow: (el) => `Enter ${el.max} or less.`,
    mismatch: 'The two passwords don\u2019t match.'
  };

  /** Return a friendly message for a field, preferring data-msg-* attributes. */
  function messageFor(el) {
    const v = el.validity;
    if (el.dataset.match) {
      const other = $(el.dataset.match);
      if (other && other.value !== el.value) return el.dataset.msgMatch || DEFAULT_MSG.mismatch;
    }
    if (v.valueMissing) return el.dataset.msgRequired || DEFAULT_MSG.valueMissing;
    if (v.typeMismatch) return el.dataset.msgType || DEFAULT_MSG.typeMismatch[el.type] || DEFAULT_MSG.patternMismatch;
    if (v.patternMismatch) return el.dataset.msgPattern || DEFAULT_MSG.patternMismatch;
    if (v.tooShort) return el.dataset.msgShort || DEFAULT_MSG.tooShort(el);
    if (v.rangeUnderflow) return DEFAULT_MSG.rangeUnderflow(el);
    if (v.rangeOverflow) return DEFAULT_MSG.rangeOverflow(el);
    if (v.customError) return el.validationMessage;
    return '';
  }

  /** Validate one field; render/clear its inline message. Returns true if valid. */
  function validateField(el) {
    if (el.dataset.match) {
      const other = $(el.dataset.match);
      el.setCustomValidity(other && other.value !== el.value ? (el.dataset.msgMatch || DEFAULT_MSG.mismatch) : '');
    }
    const ok = el.checkValidity();
    const id = el.id || el.name;
    let fb = $(`#${CSS.escape(id)}-error`);
    if (!fb) {
      fb = document.createElement('div');
      fb.className = 'invalid-feedback';
      fb.id = `${id}-error`;
      const host = el.closest('.form-check') || el.closest('.input-group') || el;
      host.insertAdjacentElement('afterend', fb);
    }
    const described = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    if (!described.includes(fb.id)) { described.push(fb.id); el.setAttribute('aria-describedby', described.join(' ')); }
    el.classList.toggle('is-invalid', !ok);
    el.classList.toggle('is-valid', ok && el.value !== '' && el.type !== 'checkbox');
    el.setAttribute('aria-invalid', String(!ok));
    fb.textContent = ok ? '' : messageFor(el);
    fb.style.display = ok ? 'none' : 'block';
    return ok;
  }

  function initForms() {
    $$('form[data-validate]').forEach((form) => {
      form.setAttribute('novalidate', '');
      const fields = () => $$('input, select, textarea', form).filter((el) => !el.disabled && el.type !== 'hidden' && el.type !== 'submit' && el.willValidate);
      let attempted = false;
      form.addEventListener('submit', (e) => {
        attempted = true;
        const invalid = fields().filter((el) => !validateField(el));
        const status = $('.form-status', form);
        if (invalid.length) {
          e.preventDefault();
          invalid[0].focus();
          if (status) { status.className = 'form-status show alert alert-danger mt-3'; status.textContent = `Please fix ${invalid.length} field${invalid.length > 1 ? 's' : ''} highlighted above.`; }
          return;
        }
        // Demo mode: no real endpoint configured yet. Remove data-demo once your
        // Formspree / Netlify / Mailchimp action URL is in place.
        if (form.hasAttribute('data-demo')) {
          e.preventDefault();
          const btn = $('[type="submit"]', form);
          if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Sending\u2026'; }
          window.setTimeout(() => {
            if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label; }
            if (status) { status.className = 'form-status show alert alert-success mt-3'; status.textContent = form.dataset.success || 'Thanks \u2014 we\u2019ve received your message and will reply within one working day.'; }
            form.reset(); attempted = false;
            fields().forEach((el) => { el.classList.remove('is-valid', 'is-invalid'); el.removeAttribute('aria-invalid'); });
            form.dispatchEvent(new CustomEvent('inkmark:submitted', { bubbles: true }));
          }, 700);
        }
      });
      form.addEventListener('input', (e) => { if (attempted || e.target.classList.contains('is-invalid')) validateField(e.target); });
      form.addEventListener('focusout', (e) => { if (e.target.matches('input, select, textarea') && e.target.value) validateField(e.target); });
    });

    // Show/hide password buttons
    $$('[data-toggle-password]').forEach((btn) => btn.addEventListener('click', () => {
      const input = $(btn.dataset.togglePassword);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      $('.bi', btn).className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
    }));
  }

  /* ------------------------------------------------------------------ */
  /* Quote list                                                         */
  /* ------------------------------------------------------------------ */
  const QUOTE_KEY = 'inkmark-quote';
  const getQuote = () => store.get(QUOTE_KEY, []);
  function renderQuote() {
    const items = getQuote();
    $$('[data-quote-count]').forEach((el) => { el.textContent = items.length ? String(items.length) : ''; el.dataset.count = String(items.length); });
    const list = $('#quoteList');
    if (!list) return;
    const empty = $('#quoteEmpty');
    list.innerHTML = '';
    items.forEach((item, i) => {
      const li = document.createElement('li');
      const info = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = item.name;
      const meta = document.createElement('div');
      meta.className = 'ticket';
      meta.textContent = item.meta || '';
      info.append(name, meta);
      const rm = document.createElement('button');
      rm.type = 'button'; rm.className = 'btn btn-ghost btn-icon';
      rm.setAttribute('aria-label', `Remove ${item.name} from quote`);
      rm.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
      rm.addEventListener('click', () => { const next = getQuote(); next.splice(i, 1); store.set(QUOTE_KEY, next); renderQuote(); announce(`${item.name} removed from your quote.`); });
      li.append(info, rm);
      list.append(li);
    });
    if (empty) empty.hidden = items.length > 0;
    const actions = $('#quoteActions');
    if (actions) actions.hidden = items.length === 0;
  }
  /** Add an item to the quote list. Exposed for plugins (stamp preview, upload). */
  function addToQuote(item) {
    const items = getQuote();
    items.push(item);
    store.set(QUOTE_KEY, items);
    renderQuote();
    announce(`${item.name} added to your quote.`);
  }
  window.InkMark.addToQuote = addToQuote;
  function initQuote() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quote-add]');
      if (!btn) return;
      const form = btn.dataset.quoteForm ? $(btn.dataset.quoteForm) : null;
      let meta = btn.dataset.meta || '';
      if (form) {
        meta = $$('[data-quote-field]', form).map((el) => {
          if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return null;
          return el.value;
        }).filter(Boolean).join(' / ');
      }
      addToQuote({ name: btn.dataset.name || 'Custom stamp', meta });
      btn.classList.add('is-pressed');
      window.setTimeout(() => btn.classList.remove('is-pressed'), 160);
    });
    $('#quoteClear')?.addEventListener('click', () => { store.set(QUOTE_KEY, []); renderQuote(); announce('Quote list cleared.'); });
    renderQuote();
    // Prefill the contact form message from the quote list
    const msg = $('#qMessage');
    if (msg && !msg.value && getQuote().length && new URLSearchParams(location.search).get('from') === 'quote') {
      msg.value = 'I\u2019d like a quote for:\n' + getQuote().map((i) => `- ${i.name}${i.meta ? ` (${i.meta})` : ''}`).join('\n');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Catalog                                                            */
  /* ------------------------------------------------------------------ */
  const CAT_LABEL = { 'self-inking': 'Self-inking', 'logo': 'Custom logo', 'notary': 'Notary & seals', 'date': 'Date & number', 'accessories': 'Accessories' };
  function productCard(p) {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-lg-4 col-xl-3 reveal is-in';
    col.innerHTML = `
      <article class="card product-card">
        <div class="product-media"><img src="${p.image}" alt="${p.alt}" width="400" height="400" loading="lazy" decoding="async"></div>
        <div class="card-body">
          <span class="ticket">${p.code} &middot; ${p.size}</span>
          <h3><a class="stretched-link text-reset text-decoration-none" href="product-details.html?id=${p.id}">${p.name}</a></h3>
          <p class="small text-muted-ink mb-1">${p.blurb}</p>
          <div class="d-flex align-items-baseline justify-content-between mt-auto">
            <span class="price">$${p.price.toFixed(2)}</span>
            <span class="badge-brass">${CAT_LABEL[p.category]}</span>
          </div>
        </div>
      </article>`;
    return col;
  }
  function skeletonCards(n) {
    return Array.from({ length: n }, () => `<div class="col-12 col-sm-6 col-lg-4 col-xl-3" aria-hidden="true"><div class="skeleton-card"><div class="skeleton sk-media"></div><div class="skeleton sk-line short"></div><div class="skeleton sk-line"></div><div class="skeleton sk-line short"></div></div></div>`).join('');
  }
  function initCatalog() {
    // Products are written directly in products.html (each card has data-product).
    // This only filters, searches and sorts those existing HTML cards.
    const grid = $('#productGrid');
    if (!grid) return;
    const all = $$('[data-product]', grid);
    if (!all.length) return;
    const state = { cat: new URLSearchParams(location.search).get('cat') || 'all', q: '', sort: 'featured' };
    const count = $('#resultCount');
    const empty = $('#catalogEmpty');
    function render() {
      let list = all.slice();
      if (state.sort === 'price-asc') list.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
      if (state.sort === 'price-desc') list.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
      if (state.sort === 'name') list.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
      list.forEach((el) => grid.append(el)); // reorder
      let shown = 0;
      list.forEach((el) => {
        const ok = (state.cat === 'all' || el.dataset.category === state.cat) && el.textContent.toLowerCase().includes(state.q);
        el.hidden = !ok; if (ok) shown += 1;
      });
      if (count) count.textContent = `${shown} product${shown === 1 ? '' : 's'}`;
      if (empty) empty.hidden = shown > 0;
      $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === state.cat)));
    }
    render();
    $$('[data-filter]').forEach((b) => b.addEventListener('click', () => { state.cat = b.dataset.filter; render(); }));
    $('#catalogSearch')?.addEventListener('input', (e) => { state.q = e.target.value.trim().toLowerCase(); render(); });
    $('#catalogSort')?.addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  }

  /* ------------------------------------------------------------------ */
  /* Blog                                                               */
  /* ------------------------------------------------------------------ */
  function initBlog() {
    const posts = $$('[data-post]');
    if (!posts.length) return;
    let cat = 'all'; let q = '';
    const empty = $('#blogEmpty');
    function apply() {
      let shown = 0;
      posts.forEach((p) => {
        const ok = (cat === 'all' || p.dataset.cat === cat) && p.textContent.toLowerCase().includes(q);
        p.hidden = !ok; if (ok) shown += 1;
      });
      if (empty) empty.hidden = shown > 0;
      $$('[data-blog-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.blogFilter === cat)));
    }
    $$('[data-blog-filter]').forEach((b) => b.addEventListener('click', () => { cat = b.dataset.blogFilter; apply(); }));
    $('#blogSearch')?.addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); apply(); });
    $('#blogSearchForm')?.addEventListener('submit', (e) => e.preventDefault());
  }

  /* ------------------------------------------------------------------ */
  /* Product details                                                    */
  /* ------------------------------------------------------------------ */
  function initProduct() {
    const root = $('#productDetail');
    if (!root) return;
    const id = new URLSearchParams(location.search).get('id');
    const p = id && window.INKMARK_PRODUCTS ? window.INKMARK_PRODUCTS.find((x) => x.id === id) : null;
    let base = Number(root.dataset.price);
    if (p) {
      base = p.price;
      $('#pdName').textContent = p.name;
      $('#pdCode').textContent = `${p.code} \u00b7 ${p.size}`;
      $('#pdBlurb').textContent = p.blurb;
      const img = $('#pdMainImg'); img.src = p.image; img.alt = p.alt;
      $('#pdCrumb').textContent = p.name;
      $('[data-quote-add]', root).dataset.name = p.name;
      document.title = `${p.name} | InkMark & Seal Co.`;
    }
    const priceEl = $('#pdPrice');
    const qty = $('#pdQty');
    function update() {
      const extra = $$('[data-price-add]:checked', root).reduce((s, el) => s + Number(el.dataset.priceAdd), 0);
      const n = Math.max(1, Number(qty.value) || 1);
      const unit = base + extra;
      const discount = n >= 100 ? 0.25 : n >= 50 ? 0.18 : n >= 10 ? 0.1 : 0;
      priceEl.textContent = `$${(unit * n * (1 - discount)).toFixed(2)}`;
      $('#pdDiscount').textContent = discount ? `Includes ${Math.round(discount * 100)}% bulk discount for ${n} pieces` : `$${unit.toFixed(2)} each \u00b7 10+ pieces save 10%`;
    }
    $$('input', root).forEach((el) => el.addEventListener('change', update));
    qty.addEventListener('input', update);
    $$('[data-qty]', root).forEach((b) => b.addEventListener('click', () => { qty.value = Math.max(1, (Number(qty.value) || 1) + Number(b.dataset.qty)); update(); }));
    // Thumbnails follow the product: rebuild them from the product's gallery photos
    const thumbs = $('.gallery-thumbs');
    if (p && thumbs && Array.isArray(p.gallery) && p.gallery.length) {
      thumbs.innerHTML = p.gallery.map((g, i) => (
        `<button type="button" data-src="${g.src}" data-alt="${g.alt}" aria-current="${i === 0}" aria-label="Show image ${i + 1}: ${g.alt}"><img src="${g.src}" alt="" width="64" height="64" loading="lazy"></button>`
      )).join('');
    }
    $$('.gallery-thumbs button').forEach((b) => b.addEventListener('click', () => {
      const img = $('#pdMainImg'); img.src = b.dataset.src; img.alt = b.dataset.alt;
      $$('.gallery-thumbs button').forEach((x) => x.setAttribute('aria-current', String(x === b)));
    }));
    update();
  }

  /* ------------------------------------------------------------------ */
  /* Countdown                                                          */
  /* ------------------------------------------------------------------ */
  function initCountdown() {
    const el = $('[data-countdown]');
    if (!el) return;
    const target = new Date(el.dataset.countdown).getTime();
    const parts = { d: $('[data-cd="d"]', el), h: $('[data-cd="h"]', el), m: $('[data-cd="m"]', el), s: $('[data-cd="s"]', el) };
    function tick() {
      const diff = Math.max(0, target - Date.now());
      parts.d.textContent = String(Math.floor(diff / 864e5));
      parts.h.textContent = String(Math.floor(diff / 36e5) % 24).padStart(2, '0');
      parts.m.textContent = String(Math.floor(diff / 6e4) % 60).padStart(2, '0');
      parts.s.textContent = String(Math.floor(diff / 1e3) % 60).padStart(2, '0');
    }
    tick(); window.setInterval(tick, 1000);
  }

  /* ------------------------------------------------------------------ */
  /* Press replay                                                       */
  /* ------------------------------------------------------------------ */
  function initPress() {
    $$('[data-press-replay]').forEach((btn) => btn.addEventListener('click', () => {
      const stage = btn.closest('.press-stage');
      stage.classList.add('replay');
      void stage.offsetWidth; // restart CSS animation
      stage.classList.remove('replay');
    }));
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                               */
  /* ------------------------------------------------------------------ */
  initTheme();
  initDirection();
  document.addEventListener('DOMContentLoaded', () => {
    $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
    initReveal();
    initTooltips();
    initForms();
    initQuote();
    initCatalog();
    initBlog();
    initProduct();
    initCountdown();
    initPress();
  });
})();
