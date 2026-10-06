# Glam Skincare

Responsive beauty storefront for **Glam Skincare — Glow. Care. Confidence.** React, Vite, TypeScript, Tailwind CSS, React Router, Framer Motion and Firebase-ready services.

## Run

```sh
npm install
npm run dev
npm run build
npm run preview
npm test
npm run test:e2e
```

Open `http://127.0.0.1:5173`. Use `npm.cmd` on Windows when PowerShell script execution is restricted. Browser tests use installed Chrome by default; `PLAYWRIGHT_CHANNEL` can override the channel.

## Phase 1

Editorial homepage, searchable/filterable/sortable collection, product gallery/zoom, colour variants, persistent stock-limited guest cart, drawer, Pakistan checkout, receipt-selection UI, local order previews, account/auth UI, FAQ search, contact, story, ritual and policy pages. Includes contextual WhatsApp, social/newsletter UI, accessible dialogs, reduced motion, route loading/error states, responsive menu/purchase controls, SEO metadata and structured-data preparation.

**This is a preview, not live commerce.** Sample values: PKR 850 price, PKR 1,100 compare-at price, 20 units per colour, PKR 200 delivery and PKR 2,500 free-delivery threshold. Values are visibly provisional. No real orders, payments, sign-ins, messages or uploads occur. Delivery fields and receipt bytes are not persisted or transmitted; only cart data and non-PII preview summaries are stored locally.

## Structure

- `src/components`: shared layout, cart, accessible UI and SEO.
- `src/config/business.ts`: central business settings, including the single WhatsApp number.
- `src/data/catalog.ts`: extensible product/variant catalog.
- `src/lib`: cart integrity and total calculations with unit tests.
- `src/pages`: storefront, checkout, content and accounts.
- `src/services`: Firebase initializer and Phase 2 repository contracts.
- `src/styles.css`: design tokens and responsive styling.
- `tests`: browser flows, responsive widths and accessibility checks.
- `public/images`: selected and descriptively named supplied photos.

Original JPEGs are untouched. [Asset audit](docs/ASSETS.md) explains all selections; DI’LAMOR remains reference-only. No replacement product images were generated.

## Firebase

Copy `.env.example` to `.env.local` when ready. Never put service-account secrets in `VITE_` variables. Firebase initializes lazily; environment settings alone do not enable commerce. Hosting configuration is included, while Firestore and Storage deny all access pending reviewed rules. Read the [Phase 2 handoff and owner checklist](docs/PHASE-2.md) before integration. No project credentials or bank details are included.

## Design

Ivory, muted blush, charcoal and warm nude, expressive serif headings and clean sans-serif labels. Real supplied photography anchors the identity. Google Fonts have local system fallbacks. Animations respect reduced motion; layouts cover 320 px through large desktop.
