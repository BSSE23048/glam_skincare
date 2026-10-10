# Release QA matrix

The release suite runs only against `demo-glam-skincare` with local Auth and Firestore emulators. Rules tests use the separate `demo-glam-rules` namespace. See `QA-REPORT.md` for actual results; this inventory alone is not a pass.

| Area | Controls and cases | Evidence |
|---|---|---|
| Public navigation | Home, shop, product, ritual, about, FAQ, contact, login, register, cart, shipping, privacy, terms, 404; direct entry and refresh | `public routes` test |
| Public forms/filters | Search/reset/sort/colour/stock, FAQ disclosure, contact draft, guest tracker | supplemental public-controls test |
| Header | Mobile menu repeated open/Escape, search field, search-result navigation | `mobile menu` test |
| Product | Pink/White 5/2, 5/0, 0/5, 0/0 stock matrix, gallery zoom/Escape, add to bag, buy now, live price, independent stock, disabled purchase | checkout, CRUD and mobile tests |
| Cart | Both colours, quantity, removal, persistence, authoritative totals, stock cap | checkout, mobile and unit tests |
| Authentication | Empty/invalid registration, registration, refresh, wrong password, recovery, customer/admin redirects, access denial, logout | authentication and admin tests |
| Checkout | Required fields, authenticated purchase, COD/manual choice, persisted snapshots, amount, customer history, refresh | both `real checkout` tests |
| Manual payment | Encoded WhatsApp recipient/name/order/amount; no file upload; verification actor/time; rejection reason | manual checkout and rejection tests |
| Admin routes | Dashboard, products, inventory, orders, payments, customers, reviews, analytics, settings, profile | every-tab direct-entry/refresh test |
| Products | Create, read, edit price and both stocks, private costs, archive all SKUs, reactivate, storefront updates | CRUD test |
| Orders | Same ID in database/customer/admin, details modal, confirmation, processing, shipping, delivery, inventory transaction | COD and manual checkout tests |
| Reviews | Approval, hiding, storefront propagation; purchase requirement and self-approval denial | moderation and rules tests |
| Settings | Shipping zero, free threshold, delivery estimate, manual payment switch, refresh and checkout effect | settings test |
| Admin profile | Save name/phone, refresh, responsive navigation | profile test |
| Responsive | 320, 375, 390, 430, 768, 1024, 1440 storefront; 320, 390, 768, 1440 admin profile | responsive tests |
| Security | Custom claim, forged email, cross-customer access, private costs, totals, status tampering, duplicate SKU, overselling, five-line order, verified reviews | eight rules tests |

Unsupported features must not be reported as tested functionality: newsletter delivery, customer review-submission UI, editable saved-address UI, discount-code redemption, shipping-label/courier integration and automated refunds are not implemented. WhatsApp links are inspected without sending messages. No real transfer, production write, deployment or billing change is part of this audit.

The older `storefront.spec.ts` and `qa-audit.spec.ts` contain guest-checkout assumptions from the prior implementation. Use the release suite for the current authenticated order architecture; do not treat those older assertions as release evidence.
