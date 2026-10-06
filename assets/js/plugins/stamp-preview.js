/**
 * InkMark — Live stamp preview (plugins/stamp-preview.js)
 * Renders an SVG impression from the visitor's text, shape, size and ink.
 * Markup hook: <section data-stamp-builder> … see pages/index.html.
 * All user text is inserted with textContent (never innerHTML).
 *
 * TODO: adjust SIZES (mm + price) and INKS to match your real catalogue.
 */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  /** Size presets per shape: label shown to the user, price in USD. */
  const SIZES = {
    round:     { S: { label: '30 mm', price: 14 }, M: { label: '38 mm', price: 18 }, L: { label: '45 mm', price: 24 } },
    oval:      { S: { label: '40 × 25 mm', price: 16 }, M: { label: '50 × 30 mm', price: 20 }, L: { label: '60 × 40 mm', price: 26 } },
    rectangle: { S: { label: '38 × 14 mm', price: 12 }, M: { label: '58 × 22 mm', price: 16 }, L: { label: '70 × 30 mm', price: 22 } },
    square:    { S: { label: '30 × 30 mm', price: 14 }, M: { label: '40 × 40 mm', price: 19 }, L: { label: '50 × 50 mm', price: 25 } }
  };
  const INKS = { black: '#1E1E22', blue: '#1F3F8F', red: '#B3261E', green: '#22663A', violet: '#5B3A8C', white: '#FFFFFF' };
  const FONTS = { serif: '"Young Serif", Georgia, serif', sans: '"Public Sans", Arial, sans-serif', mono: '"Courier Prime", "Courier New", monospace' };
  const SCALE = { S: 0.82, M: 0.92, L: 1 };

  /** Create an SVG element with attributes. */
  function el(name, attrs = {}, text) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /** Font size that fits `text` into `width` user units, capped at `max`. */
  function fit(text, width, max, ratio = 0.6) {
    const len = Math.max(1, text.length);
    return Math.max(9, Math.min(max, width / (len * ratio)));
  }

  /** Ink-grain filter: speckles and slight edge wobble like a real impression. */
  function inkFilter(id) {
    const f = el('filter', { id, x: '-5%', y: '-5%', width: '110%', height: '110%' });
    f.append(
      el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.85', numOctaves: '2', seed: '7', result: 'noise' }),
      el('feColorMatrix', { in: 'noise', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.5 0 0 0 1.5', result: 'mask' }),
      el('feComposite', { in: 'SourceGraphic', in2: 'mask', operator: 'in', result: 'speckled' }),
      el('feDisplacementMap', { in: 'speckled', in2: 'noise', scale: '1.6', xChannelSelector: 'R', yChannelSelector: 'G' })
    );
    return f;
  }

  /** Text on a path (used for ring text on round/oval stamps). */
  function arcText(g, pathId, d, text, size, font, color) {
    g.append(el('path', { id: pathId, d, fill: 'none' }));
    const t = el('text', { 'font-size': size, 'font-family': font, fill: color, 'letter-spacing': '1.5', 'dominant-baseline': 'middle' });
    const tp = el('textPath', { href: `#${pathId}`, startOffset: '50%', 'text-anchor': 'middle' }, text);
    t.append(tp); g.append(t);
  }

  /** Centered straight text line. */
  function line(g, x, y, text, size, font, color, weight = 400) {
    if (!text) return;
    g.append(el('text', { x, y, 'font-size': size, 'font-family': font, 'font-weight': weight, fill: color, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, text));
  }

  /** Draw the impression for the current state into a fresh <svg>. */
  function draw(state, uid) {
    const color = INKS[state.ink];
    const font = FONTS[state.font];
    const [t1, t2, t3] = [state.l1.trim(), state.l2.trim(), state.l3.trim()];
    const dims = { round: [300, 300], square: [300, 300], oval: [360, 240], rectangle: [380, 190] }[state.shape];
    const svg = el('svg', { xmlns: NS, viewBox: `0 0 ${dims[0]} ${dims[1]}`, role: 'img', 'aria-labelledby': `${uid}-title` });
    svg.append(el('title', { id: `${uid}-title` }, `Preview of a ${state.shape} stamp in ${state.ink} ink reading: ${[t1, t2, t3].filter(Boolean).join(', ') || 'no text yet'}`));
    const defs = el('defs'); svg.append(defs);
    if (state.worn) defs.append(inkFilter(`${uid}-ink`));
    const s = SCALE[state.size];
    const g = el('g', { transform: `translate(${dims[0] / 2} ${dims[1] / 2}) scale(${s}) translate(${-dims[0] / 2} ${-dims[1] / 2})` });
    if (state.worn) g.setAttribute('filter', `url(#${uid}-ink)`);
    const stroke = { fill: 'none', stroke: color };

    if (state.shape === 'round') {
      g.append(el('circle', { cx: 150, cy: 150, r: 140, 'stroke-width': 7, ...stroke }));
      if (state.double) g.append(el('circle', { cx: 150, cy: 150, r: 113, 'stroke-width': 2.5, ...stroke }));
      arcText(g, `${uid}-top`, 'M 23,150 A 127,127 0 0 1 277,150', t1, fit(t1, 300, 24), font, color);
      arcText(g, `${uid}-bot`, 'M 23,150 A 127,127 0 0 0 277,150', t3, fit(t3, 300, 20), font, color);
      ['M 18 150 l 6 -3 l 0 6 z', 'M 282 150 l -6 -3 l 0 6 z'].forEach((d) => g.append(el('path', { d, fill: color })));
      line(g, 150, 150, t2, fit(t2, 190, 34), font, color);
      g.append(el('line', { x1: 90, y1: 124, x2: 210, y2: 124, 'stroke-width': 1.5, ...stroke }));
      g.append(el('line', { x1: 90, y1: 176, x2: 210, y2: 176, 'stroke-width': 1.5, ...stroke }));
    } else if (state.shape === 'oval') {
      g.append(el('ellipse', { cx: 180, cy: 120, rx: 172, ry: 112, 'stroke-width': 6, ...stroke }));
      if (state.double) g.append(el('ellipse', { cx: 180, cy: 120, rx: 140, ry: 82, 'stroke-width': 2.5, ...stroke }));
      arcText(g, `${uid}-top`, 'M 24,120 A 156,97 0 0 1 336,120', t1, fit(t1, 330, 22), font, color);
      arcText(g, `${uid}-bot`, 'M 24,120 A 156,97 0 0 0 336,120', t3, fit(t3, 330, 18), font, color);
      line(g, 180, 120, t2, fit(t2, 230, 32), font, color);
    } else {
      const [w, h] = dims;
      g.append(el('rect', { x: 6, y: 6, width: w - 12, height: h - 12, rx: 6, 'stroke-width': 6, ...stroke }));
      if (state.double) g.append(el('rect', { x: 17, y: 17, width: w - 34, height: h - 34, rx: 3, 'stroke-width': 2, ...stroke }));
      const lines = [t1, t2, t3].filter(Boolean);
      const avail = w - 60;
      const gap = state.shape === 'square' ? 64 : 46;
      const startY = h / 2 - ((lines.length - 1) * gap) / 2;
      lines.forEach((txt, i) => {
        const emphasis = (lines.length === 3 && i === 1) || lines.length === 1;
        const max = emphasis ? (state.shape === 'square' ? 40 : 36) : (state.shape === 'square' ? 24 : 22);
        line(g, w / 2, startY + i * gap, txt, fit(txt, avail, max), font, color, emphasis ? 700 : 400);
      });
    }
    svg.append(g);
    return svg;
  }

  /** Wire up one builder instance. */
  function init(root, index) {
    const out = root.querySelector('[data-stamp-output]');
    const summary = root.querySelector('[data-stamp-summary]');
    const sizeLabel = root.querySelector('[data-stamp-size]');
    const priceLabel = root.querySelector('[data-stamp-price]');
    const uid = `stamp${index}`;
    let timer;

    const read = () => {
      const val = (name) => (root.querySelector(`[name="${name}"]:checked`) || root.querySelector(`[name="${name}"]`)).value;
      return {
        l1: root.querySelector('[name="sp-line1"]').value,
        l2: root.querySelector('[name="sp-line2"]').value,
        l3: root.querySelector('[name="sp-line3"]').value,
        shape: val('sp-shape'), size: val('sp-size'), ink: val('sp-ink'), font: val('sp-font'),
        double: root.querySelector('[name="sp-double"]').checked,
        worn: root.querySelector('[name="sp-worn"]').checked
      };
    };

    const render = (animate) => {
      const state = read();
      out.replaceChildren(draw(state, uid));
      const preset = SIZES[state.shape][state.size];
      sizeLabel.textContent = `${state.shape} · ${preset.label} · ${state.ink} ink`;
      priceLabel.textContent = `$${preset.price.toFixed(2)}`;
      // Debounced announcement so screen readers aren't flooded while typing
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { summary.textContent = `Preview updated: ${state.shape} stamp, ${preset.label}, ${state.ink} ink, from $${preset.price}.`; }, 700);
      if (animate) { out.classList.remove('pressing'); void out.offsetWidth; out.classList.add('pressing'); }
      return { state, preset };
    };

    root.addEventListener('input', (e) => render(e.target.type !== 'text'));
    root.addEventListener('change', (e) => { if (e.target.type !== 'text') render(true); });

    // Export the live preview as a PNG image (1200 px wide, transparent background).
    root.querySelector('[data-stamp-download]')?.addEventListener('click', () => {
      const svg = out.querySelector('svg').cloneNode(true);
      const [, , vw, vh] = svg.getAttribute('viewBox').split(' ').map(Number);
      const W = 1200; const H = Math.round((W * vh) / vw);
      svg.setAttribute('width', String(W)); svg.setAttribute('height', String(H));
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        canvas.getContext('2d').drawImage(img, 0, 0, W, H);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'my-stamp-preview.png';
          document.body.append(a); a.click(); a.remove();
          window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          window.InkMark?.announce('Preview downloaded as a PNG image.');
        }, 'image/png');
      };
      img.src = url;
    });
    root.querySelector('[data-stamp-quote]')?.addEventListener('click', () => {
      const { state, preset } = render(false);
      const text = [state.l1, state.l2, state.l3].map((t) => t.trim()).filter(Boolean).join(' | ');
      window.InkMark?.addToQuote({ name: `Custom ${state.shape} stamp`, meta: `${preset.label} / ${state.ink} ink / “${text}”` });
    });
    render(false);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-stamp-builder]').forEach(init);
  });
})();
