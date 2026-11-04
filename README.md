# InkMark & Seal Co. — HTML template for custom rubber stamp & seal shops

A multi-page, static HTML template for a rubber stamp, self-inking stamp, notary seal and embosser workshop.
Built with Bootstrap 5.3, Bootstrap Icons, custom CSS variables and vanilla ES6+ JavaScript. No build step.

**Full documentation:** open `documentation/index.html` in a browser.

## Quick start

1. Unzip and open `pages/index.html` in a browser, or serve the folder:
   `npx serve .` / `python3 -m http.server` and visit `http://localhost:8000/pages/`.
2. Search the project for `TODO` to find every customisation point (domain, form endpoints, map, payments).
3. Replace `https://www.inkmark.example` with your domain in all pages, `sitemap.xml` and `robots.txt`.

## What's inside

```
inkmark-template/
├── index.html                 redirect to pages/index.html
├── sitemap.xml  robots.txt
├── assets/
│   ├── css/  style.css  dark-mode.css  rtl.css
│   ├── js/   main.js
│   │   └── plugins/  stamp-preview.js  upload.js  catalog.js
│   ├── images/  WebP: products/ hero/ samples/ about/ blog/ team/ avatars/ misc/ logo-mark*
│   │           PNG: favicon-32, apple-touch-icon, og-card
│   └── fonts/   (empty; for self-hosted fonts)
├── pages/   18 pages (see below)
├── documentation/index.html
└── README.md
```

### Pages
Home 1 (`index.html`), Home 2 business & legal (`home-2.html`), About, Products, Product Details, Services,
Service Details, Design Upload, Bulk Orders, Pricing, Blog, Blog Details, Contact, Login/Register,
404, Coming Soon.

### Key features
- Live stamp preview: type text, choose shape, size, ink and lettering, see the impression live, download it as a PNG or add it to a quote.
- Drag-and-drop artwork upload with PNG/JPG/SVG/PDF validation and preview.
- Quote list saved in localStorage, shared across pages via the header drawer.
- Filterable, searchable product catalogue with skeleton loaders.
- Dark/light mode (system detection + saved choice), full RTL, WCAG 2.1 AA focused, reduced-motion aware.
- Inline form validation with friendly messages and tooltips on every form.
- SEO: unique titles and descriptions, Open Graph, JSON-LD (Store/LocalBusiness, Product, FAQPage, BlogPosting).

## Credits
Bootstrap 5.3.3 (MIT) · Bootstrap Icons 1.11.3 (MIT) · Google Fonts: Young Serif, Public Sans, Courier Prime (SIL OFL).
All images are original artwork made for this template (WebP/PNG) and may be used with it. They are placeholders: swap in your own product and workshop photos.

## Changelog
- **1.1.0** (2026-10-05): all illustrations, logo and favicon delivered as WebP/PNG image files; live preview exports PNG.
- **1.0.0** (2026-10-05): initial release.

## Support
See `documentation/index.html#support`.
