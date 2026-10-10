# Current application architecture

The existing React/Vite storefront uses Firebase Authentication and Cloud Firestore. Firebase Hosting serves the built SPA with a catch-all rewrite to `index.html`. No deployment was performed during QA.

- `contexts/AuthContext.tsx` restores sessions and resolves the custom `admin` claim. Email addresses are never an authorization mechanism.
- `contexts/SiteContext.tsx` subscribes to active products, SKU inventory, settings and approved reviews. Configured stores do not silently resurrect seed products.
- `store.tsx` persists only the cart locally. Prices and availability come from the live catalog.
- `services/orders.ts` creates authoritative orders transactionally, validates live SKU stock/prices, records the checkout throttle, and updates order status and inventory together.
- `pages/OrderDetail.tsx` and customer/admin order lists subscribe to Firestore. A successful checkout requires a committed database write.
- `services/products.ts` saves product/SKU changes atomically, keeps costs in admin-only `productCosts`, reserves slugs, archives every SKU and adjusts inventory transactionally.

Manual payment uses WhatsApp screenshots. Customers place the order first and then open the prefilled WhatsApp message. Staff verify or reject in the admin portal. Firebase Storage, receipt uploads and Cloud Functions are not required by this implementation.

## Local verification

Use Node 22 and Java 21. The emulator helper supports the portable Java installation under `.audit/java`.

```powershell
npm.cmd run emulators
npm.cmd run seed:local
npm.cmd run build:qa
npm.cmd run test:release
npm.cmd run test:rules
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Run the emulator command in its own terminal. `.env.qa` points only to the demo emulator project; the release browser suite uses the built QA preview on port 5175. `.env.local` remains the owner's private configuration.

## Production preparation

Confirm the owner's product prices/stock, shipping/returns, bank details, domain and Firebase project. Temporary defaults are not bank-account verification. Assign the admin custom claim using trusted credentials outside the repository, then sign out/in. The bootstrap script accepts an explicit key path or Application Default Credentials; it no longer searches the repository for private keys.

Existing production catalog documents created by older code need an owner-reviewed migration: move any public cost fields into `productCosts`, remove them from public products/SKUs, reconcile all variant stock and active flags, and populate unique `productSlugs`. Do not blindly reseed production. Updated rules reject public cost fields.

Publish Hosting, rules and indexes only after the release gate and explicit deployment authorization. Verify authorized domains, actual production custom claims and indexes, and repeat the purchase/admin smoke test on staging. Consult `QA-REPORT.md` for the audit verdict and outstanding limitations.
