# Phase 1 verification — 6 October 2026

- `npm run build`: passed TypeScript and Vite production build. Checkout, product, shop and home routes are split into chunks. Output: `dist/`.
- `npm test`: 6 unit tests passed (cart integrity, stock caps, totals, discounts, WhatsApp encoding and corrupt preview storage).
- Playwright: all 6 browser scenarios passed. Four passed in the final full run; the responsive and bank-checkout cases were interrupted by Chrome `ERR_NETWORK_IO_SUSPENDED` / `ERR_NETWORK_CHANGED` and both passed unchanged via `--last-failed`.
- 17 routes rendered without uncaught JavaScript errors or detected broken loaded images.
- Home, shop, product, contact, login, populated cart and populated checkout fit widths 320, 375, 390, 430, 768, 1024, 1280, 1440 and 1920 px without horizontal overflow.
- Cart tests cover search, variants, persistence, quantity and removal. Checkout tests cover bank receipt selection, COD, invalid phone, invalid file type, receipt removal, privacy of local storage, order help links and clearing previews.
- Keyboard checks cover menu Escape/focus restoration and product zoom navigation. Dialogs use a portal, focus trapping and inert background content.
- Axe WCAG 2 A/AA and WCAG 2.1 AA scans found no violations on home, product, contact and login at a 390 px viewport. This is automated coverage, not a full accessibility certification.
- Desktop and mobile screenshots were visually reviewed. Development screenshots are in the ignored `.audit/` folder; regenerate with `node scripts/screenshots.mjs` while Vite is running.
- Dependency install/audit after patched Vitest and gRPC dependencies: 0 known vulnerabilities.

Browser tests used installed desktop Chrome with emulated viewport sizes, not physical iOS/Android devices. Live Firebase, email, payment verification and hosting remain Phase 2 and have not been represented as tested integrations. The local server is at `http://127.0.0.1:5173`.
