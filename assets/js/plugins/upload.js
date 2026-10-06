/**
 * InkMark — Design upload (plugins/upload.js)
 * Drag-and-drop file zone with type/size validation and an "impression"
 * preview of the first image. Markup hook: [data-dropzone] containing an
 * <input type="file">. Valid files are written back to the input with
 * DataTransfer, so a normal multipart form POST sends them.
 *
 * TODO: change ACCEPT / MAX_MB / MAX_FILES to match your workflow.
 */
(() => {
  'use strict';
  const ACCEPT = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', pdf: 'application/pdf' };
  const MAX_MB = 10;
  const MAX_FILES = 5;

  const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
  const ext = (name) => (name.split('.').pop() || '').toLowerCase();

  /** Return an error string for a file, or '' if it is acceptable. */
  function check(file) {
    const e = ext(file.name);
    if (!ACCEPT[e]) return `“.${e}” files can’t be used. Upload PNG, JPG, SVG or PDF.`;
    if (file.type && file.type !== ACCEPT[e] && !(e === 'jpg' && file.type === 'image/jpeg')) return 'The file type doesn’t match its extension. Re-export the file and try again.';
    if (file.size > MAX_MB * 1048576) return `This file is ${fmtSize(file.size)}. The limit is ${MAX_MB} MB; export at 300 dpi or use SVG/PDF.`;
    return '';
  }

  function init(zone) {
    const input = zone.querySelector('input[type="file"]');
    const list = document.querySelector(zone.dataset.list);
    const preview = document.querySelector(zone.dataset.preview);
    let files = [];

    function sync() {
      const dt = new DataTransfer();
      files.filter((f) => !f.error).forEach((f) => dt.items.add(f.file));
      input.files = dt.files;
      input.setCustomValidity(dt.files.length ? '' : 'Add at least one valid PNG, JPG, SVG or PDF file.');
    }

    function renderPreview() {
      if (!preview) return;
      const first = files.find((f) => !f.error && f.file.type.startsWith('image/'));
      preview.replaceChildren();
      if (first) {
        const img = document.createElement('img');
        img.src = first.url; img.alt = `Impression preview of ${first.file.name}`;
        preview.append(img);
      } else {
        const p = document.createElement('p');
        p.className = 'text-center mb-0 text-muted-ink';
        p.textContent = files.some((f) => !f.error) ? 'PDF received. We’ll show it in your proof.' : 'Your artwork preview will appear here.';
        preview.append(p);
      }
    }

    function render() {
      list.replaceChildren();
      files.forEach((f, i) => {
        const li = document.createElement('li');
        li.className = `upload-item${f.error ? ' error' : ''}`;
        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        if (!f.error && f.file.type.startsWith('image/')) {
          const img = document.createElement('img'); img.src = f.url; img.alt = ''; thumb.append(img);
        } else {
          thumb.innerHTML = `<i class="bi ${f.error ? 'bi-exclamation-octagon' : 'bi-file-earmark-pdf'}" aria-hidden="true"></i>`;
        }
        const info = document.createElement('div');
        const name = document.createElement('strong'); name.className = 'd-block text-break'; name.textContent = f.file.name;
        const meta = document.createElement('span');
        meta.className = f.error ? 'small text-red fw-semibold' : 'ticket';
        meta.textContent = f.error || `${ext(f.file.name)} · ${fmtSize(f.file.size)} · ready`;
        info.append(name, meta);
        const rm = document.createElement('button');
        rm.type = 'button'; rm.className = 'btn btn-ghost btn-sm';
        rm.innerHTML = '<i class="bi bi-trash3" aria-hidden="true"></i> Remove';
        rm.setAttribute('aria-label', `Remove ${f.file.name}`);
        rm.addEventListener('click', () => { if (f.url) URL.revokeObjectURL(f.url); files.splice(i, 1); render(); sync(); window.InkMark?.announce(`${f.file.name} removed.`); });
        li.append(thumb, info, rm);
        list.append(li);
      });
      renderPreview();
    }

    function add(fileList) {
      const incoming = Array.from(fileList);
      incoming.forEach((file) => {
        if (files.filter((f) => !f.error).length >= MAX_FILES) { files.push({ file, error: `Only ${MAX_FILES} files per order. Send extras by email.` }); return; }
        const error = check(file);
        files.push({ file, error, url: !error && file.type.startsWith('image/') ? URL.createObjectURL(file) : '' });
      });
      render(); sync();
      const ok = incoming.filter((f) => !check(f)).length;
      window.InkMark?.announce(`${ok} of ${incoming.length} file${incoming.length > 1 ? 's' : ''} added.`);
    }

    ['dragenter', 'dragover'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add('is-dragover'); }));
    ['dragleave', 'drop'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.remove('is-dragover'); }));
    zone.addEventListener('drop', (e) => { if (e.dataTransfer?.files.length) add(e.dataTransfer.files); });
    input.addEventListener('change', () => { if (input.files.length) { const picked = Array.from(input.files); add(picked); } });
    input.closest('form')?.addEventListener('inkmark:submitted', () => { files = []; render(); sync(); });
    sync(); renderPreview();
  }

  document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('[data-dropzone]').forEach(init));
})();
