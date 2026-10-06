/**
 * InkMark — Admin dashboard (dashboard.js)
 * Demo data + rendering for pages/dashboard.html. Replace the DATA object
 * with calls to your API (see TODO markers). No frameworks, no build step.
 */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  /* TODO: replace demo data with fetch('/api/…') calls. ----------------- */
  const DATA = {
    stats: [
      { label: 'Orders this month', value: '412', delta: '+12%', icon: 'bi-box-seam' },
      { label: 'Revenue', value: '$9,684', delta: '+8.4%', icon: 'bi-cash-coin' },
      { label: 'Proofs awaiting approval', value: '23', delta: '6 over 24 h', icon: 'bi-hourglass-split' },
      { label: 'Bulk enquiries', value: '17', delta: '+5 this week', icon: 'bi-buildings' }
    ],
    revenue: [5200, 6100, 5800, 7400, 6900, 8200, 7600, 8800, 9100, 8700, 9400, 9684],
    months: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    orders: [
      { id: 'IM-10482', customer: 'Harbor Dental Group', item: 'Self-inking address ×12', total: 172.8, status: 'making', date: '2026-10-04' },
      { id: 'IM-10481', customer: 'R. Okafor, Notary', item: 'Desk embosser Ø41', total: 58, status: 'proof', date: '2026-10-04' },
      { id: 'IM-10480', customer: 'Lindqvist Primary', item: 'Teacher reward set ×40', total: 512, status: 'new', date: '2026-10-03' },
      { id: 'IM-10479', customer: 'Bramble & Co. Bakery', item: 'Logo stamp 60×40', total: 34, status: 'shipped', date: '2026-10-03' },
      { id: 'IM-10478', customer: 'City Records Office', item: 'RECEIVED dater ×25', total: 680, status: 'making', date: '2026-10-02' },
      { id: 'IM-10477', customer: 'Mei Tanaka', item: 'Round seal Ø38', total: 18, status: 'shipped', date: '2026-10-02' },
      { id: 'IM-10476', customer: 'Northgate Legal LLP', item: 'Notary ink seal ×6', total: 129.6, status: 'hold', date: '2026-10-01' },
      { id: 'IM-10475', customer: 'Quill Craft Studio', item: 'Wooden logo stamp', total: 28, status: 'shipped', date: '2026-09-30' },
      { id: 'IM-10474', customer: 'Avenue Pharmacy', item: 'Numberer 6-digit', total: 54, status: 'proof', date: '2026-09-30' },
      { id: 'IM-10473', customer: 'Sunrise Logistics', item: 'PAID stamp ×10', total: 144, status: 'shipped', date: '2026-09-29' }
    ],
    uploads: [
      { file: 'harbor-dental-logo.svg', customer: 'Harbor Dental Group', size: '58 × 22 mm', ink: 'Blue', note: 'Use the tooth icon only, no tagline.', age: '2 h' },
      { file: 'bramble-wordmark.png', customer: 'Bramble & Co. Bakery', size: '60 × 40 mm', ink: 'Red', note: 'Thicken the thin script strokes if needed.', age: '5 h' },
      { file: 'lindqvist-crest.pdf', customer: 'Lindqvist Primary', size: 'Ø 40 mm', ink: 'Green', note: '40 copies, deadline 14 Oct.', age: '1 d' }
    ],
    users: [
      { name: 'Ana Ruiz', email: 'ana@inkmark.example', role: 'Owner', last: 'Today' },
      { name: 'Tom Becker', email: 'tom@inkmark.example', role: 'Production', last: 'Today' },
      { name: 'Priya Natarajan', email: 'priya@inkmark.example', role: 'Design', last: 'Yesterday' },
      { name: 'Sam Holt', email: 'sam@inkmark.example', role: 'Support', last: '3 days ago' }
    ],
    messages: [
      { from: 'Grace Whitfield', subject: 'Can you match Pantone 286?', body: 'We need 30 self-inkers in our brand blue for the new branch. Is Pantone 286 possible, and what would the lead time be?', time: '09:12', unread: true },
      { from: 'Daniel Mensah', subject: 'Embosser for Ghana notary commission', body: 'Do you make embossers that meet the Ghana notary seal format? I can send the regulation text.', time: 'Yesterday', unread: true },
      { from: 'Lindqvist Primary', subject: 'Re: proof for crest stamp', body: 'The proof looks great. Please make the motto slightly larger and go ahead.', time: 'Mon', unread: false }
    ]
  };
  const STATUS = { new: 'New', proof: 'Awaiting proof', making: 'In production', shipped: 'Shipped', hold: 'On hold' };

  /* Navigation between dashboard sections ---------------------------- */
  function initNav() {
    const links = $$('[data-dash-target]');
    const show = (id) => {
      $$('.dash-section').forEach((s) => { s.hidden = s.id !== id; });
      links.forEach((l) => { if (l.dataset.dashTarget === id) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current'); });
      const h = $(`#${id} h2`); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      history.replaceState(null, '', `#${id}`);
      const off = $('#dashSidebar'); if (off && window.bootstrap) window.bootstrap.Offcanvas.getInstance(off)?.hide();
    };
    links.forEach((l) => l.addEventListener('click', (e) => { e.preventDefault(); show(l.dataset.dashTarget); }));
    const initial = location.hash.slice(1);
    if (initial && $(`#${initial}.dash-section`)) show(initial);
  }

  /* Overview: stat cards + chart (with skeletons) -------------------- */
  function renderStats() {
    const wrap = $('#statCards');
    wrap.setAttribute('aria-busy', 'false');
    wrap.innerHTML = DATA.stats.map((s) => `
      <div class="col-12 col-sm-6 col-xl-3"><div class="card h-100 p-3 stat-card">
        <div class="d-flex justify-content-between align-items-start"><span class="ticket">${esc(s.label)}</span><i class="bi ${s.icon} fs-4 text-red" aria-hidden="true"></i></div>
        <p class="h2 mb-1 mt-2">${esc(s.value)}</p><span class="small text-muted-ink">${esc(s.delta)}</span>
      </div></div>`).join('');
  }
  function renderChart() {
    const host = $('#revenueChart');
    host.setAttribute('aria-busy', 'false');
    const W = 720; const H = 260; const pad = 32; const max = Math.max(...DATA.revenue) * 1.1;
    const bw = (W - pad * 2) / DATA.revenue.length;
    const bars = DATA.revenue.map((v, i) => {
      const h = ((H - pad * 2) * v) / max; const x = pad + i * bw + 6; const y = H - pad - h;
      const last = i === DATA.revenue.length - 1;
      return `<g><rect x="${x}" y="${y}" width="${bw - 12}" height="${h}" rx="2" fill="${last ? 'var(--c-secondary)' : 'var(--c-primary)'}" opacity="${last ? 1 : 0.85}"><title>${DATA.months[i]}: $${v.toLocaleString()}</title></rect>
        <text x="${x + (bw - 12) / 2}" y="${H - 10}" text-anchor="middle" font-size="12" fill="var(--c-muted)" font-family="var(--f-mono)">${DATA.months[i]}</text></g>`;
    }).join('');
    const grid = [0.25, 0.5, 0.75, 1].map((f) => `<line x1="${pad}" x2="${W - pad}" y1="${H - pad - (H - pad * 2) * f}" y2="${H - pad - (H - pad * 2) * f}" stroke="var(--c-border)" stroke-dasharray="3 5"/>`).join('');
    host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="chartTitle chartDesc" class="w-100 h-auto"><title id="chartTitle">Monthly revenue, last 12 months</title><desc id="chartDesc">Revenue rose from $5,200 in November to $9,684 in October.</desc>${grid}${bars}</svg>`;
  }

  /* Orders table: search, status filter, sort ------------------------ */
  function orderRow(o) {
    return `<tr><td data-label="Order"><span class="ticket text-ink">${esc(o.id)}</span></td><td data-label="Customer">${esc(o.customer)}</td><td data-label="Item">${esc(o.item)}</td>
      <td data-label="Total">$${o.total.toFixed(2)}</td><td data-label="Status"><span class="status status-${o.status}">${STATUS[o.status]}</span></td><td data-label="Date">${esc(o.date)}</td>
      <td data-label="Actions"><button type="button" class="btn btn-ghost btn-sm" data-order-view="${esc(o.id)}" aria-label="View order ${esc(o.id)}"><i class="bi bi-eye" aria-hidden="true"></i></button></td></tr>`;
  }
  function initOrders() {
    $('#recentOrders').innerHTML = DATA.orders.slice(0, 5).map((o) => `<tr><td data-label="Order"><span class="ticket text-ink">${esc(o.id)}</span></td><td data-label="Customer">${esc(o.customer)}</td><td data-label="Total">$${o.total.toFixed(2)}</td><td data-label="Status"><span class="status status-${o.status}">${STATUS[o.status]}</span></td></tr>`).join('');
    const body = $('#ordersBody');
    const state = { q: '', status: 'all', sort: 'date', dir: -1 };
    function render() {
      let rows = DATA.orders.filter((o) => (state.status === 'all' || o.status === state.status) && `${o.id} ${o.customer} ${o.item}`.toLowerCase().includes(state.q));
      rows = rows.slice().sort((a, b) => (a[state.sort] > b[state.sort] ? 1 : -1) * state.dir);
      body.innerHTML = rows.length ? rows.map(orderRow).join('') : '<tr><td colspan="7" class="text-center py-4">No orders match these filters. Clear the search or choose “All statuses”.</td></tr>';
      $('#ordersCount').textContent = `${rows.length} of ${DATA.orders.length} orders`;
    }
    $('#orderSearch').addEventListener('input', (e) => { state.q = e.target.value.trim().toLowerCase(); render(); });
    $('#orderStatus').addEventListener('change', (e) => { state.status = e.target.value; render(); });
    $$('[data-sort]').forEach((th) => {
      const btn = $('button', th);
      btn.addEventListener('click', () => {
        const key = th.dataset.sort;
        state.dir = state.sort === key ? -state.dir : 1; state.sort = key;
        $$('[data-sort]').forEach((t) => t.setAttribute('aria-sort', 'none'));
        th.setAttribute('aria-sort', state.dir === 1 ? 'ascending' : 'descending');
        render();
      });
    });
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-order-view]'); if (!b) return;
      const o = DATA.orders.find((x) => x.id === b.dataset.orderView);
      $('#orderModalTitle').textContent = `Order ${o.id}`;
      $('#orderModalBody').innerHTML = `<ul class="spec-list"><li><span>Customer</span><span>${esc(o.customer)}</span></li><li><span>Item</span><span>${esc(o.item)}</span></li><li><span>Total</span><span>$${o.total.toFixed(2)}</span></li><li><span>Status</span><span>${STATUS[o.status]}</span></li><li><span>Placed</span><span>${esc(o.date)}</span></li></ul>`;
      window.bootstrap.Modal.getOrCreateInstance($('#orderModal')).show();
    });
    render();
  }

  /* Upload queue ------------------------------------------------------ */
  function initUploads() {
    const wrap = $('#uploadQueue');
    const badge = $('#uploadBadge');
    function render() {
      badge.textContent = String(DATA.uploads.length);
      wrap.innerHTML = DATA.uploads.length ? DATA.uploads.map((u, i) => `
        <div class="col-12 col-lg-4"><article class="card h-100 p-3">
          <div class="d-flex gap-3 align-items-center mb-2"><span class="q-icon"><i class="bi bi-file-earmark-image fs-4 text-ink" aria-hidden="true"></i></span>
          <div><h3 class="h5 mb-0 text-break">${esc(u.file)}</h3><span class="ticket">${esc(u.customer)}</span></div></div>
          <ul class="spec-list small mb-3"><li><span>Size</span><span>${esc(u.size)}</span></li><li><span>Ink</span><span>${esc(u.ink)}</span></li><li><span>Waiting</span><span>${esc(u.age)}</span></li></ul>
          <p class="small mb-3">“${esc(u.note)}”</p>
          <div class="d-flex gap-2 mt-auto flex-wrap"><button type="button" class="btn btn-ink btn-sm" data-upload-act="approve" data-i="${i}"><i class="bi bi-check2-circle" aria-hidden="true"></i> Send proof</button>
          <button type="button" class="btn btn-outline-ink btn-sm" data-upload-act="changes" data-i="${i}"><i class="bi bi-chat-left-text" aria-hidden="true"></i> Ask for changes</button></div>
        </article></div>`).join('') : '<div class="col-12"><div class="alert alert-success mb-0">The upload queue is clear. New customer artwork will appear here.</div></div>';
    }
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-upload-act]'); if (!b) return;
      const u = DATA.uploads.splice(Number(b.dataset.i), 1)[0];
      window.InkMark?.announce(b.dataset.uploadAct === 'approve' ? `Proof sent to ${u.customer}.` : `Change request sent to ${u.customer}.`);
      render();
    });
    render();
  }

  /* Users + messages -------------------------------------------------- */
  function initUsers() {
    $('#usersBody').innerHTML = DATA.users.map((u) => `<tr><td data-label="Name"><strong>${esc(u.name)}</strong></td><td data-label="Email">${esc(u.email)}</td><td data-label="Role"><span class="badge-brass">${esc(u.role)}</span></td><td data-label="Last active">${esc(u.last)}</td></tr>`).join('');
  }
  function initMessages() {
    const list = $('#messageList'); const pane = $('#messagePane');
    function open(i) {
      const m = DATA.messages[i]; m.unread = false;
      pane.innerHTML = `<h3 class="h4">${esc(m.subject)}</h3><p class="ticket">From ${esc(m.from)} · ${esc(m.time)}</p><p>${esc(m.body)}</p><a class="btn btn-ink btn-sm" href="mailto:hello@inkmark.example?subject=${encodeURIComponent('Re: ' + m.subject)}"><i class="bi bi-reply" aria-hidden="true"></i> Reply by email</a>`;
      render(i);
    }
    function render(active = -1) {
      list.innerHTML = DATA.messages.map((m, i) => `<li><button type="button" class="list-group-item list-group-item-action w-100 text-start py-3 ${i === active ? 'active' : ''}" data-msg="${i}" ${i === active ? 'aria-current="true"' : ''}>
        <span class="d-flex justify-content-between"><strong>${m.unread ? '<span class="visually-hidden">Unread: </span><i class="bi bi-circle-fill text-red small" aria-hidden="true"></i> ' : ''}${esc(m.from)}</strong><span class="ticket">${esc(m.time)}</span></span><span class="d-block small">${esc(m.subject)}</span></button></li>`).join('');
      $('#msgBadge').textContent = String(DATA.messages.filter((m) => m.unread).length);
    }
    list.addEventListener('click', (e) => { const b = e.target.closest('[data-msg]'); if (b) open(Number(b.dataset.msg)); });
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!$('#dashboard')) return;
    initNav();
    // Simulated API latency so the skeleton loaders are visible in the demo.
    window.setTimeout(() => { renderStats(); renderChart(); }, 700);
    initOrders(); initUploads(); initUsers(); initMessages();
  });
})();
