# Phase 2 handoff

## Boundary

The storefront is a Phase 1 preview. `business.preview` is true. Auth, contact and newsletter forms validate input and explicitly state that nothing was submitted. Checkout creates a local preview reference, never charges money, and does not transmit or save customer delivery details. Receipt bytes are not uploaded. Do not simply switch off the preview flag to launch.

## Integration points

- `src/config/business.ts`: central WhatsApp, Instagram, currency, final origin, shipping and bank configuration.
- `src/data/catalog.ts` and `src/types.ts`: extensible product/variant data, stock, prices, review types and order contracts. Catalog values are illustrative.
- `src/services/contracts.ts`: catalog, auth, order, subscription and review repositories to implement.
- `src/services/firebase.ts`: lazy modular initializer for Auth, Firestore and Storage; returns null without configuration.
- `src/store.tsx`: guest cart and local preview state. No customer PII or receipt contents persist.
- `src/lib/commerce.ts`: client display totals; never use these as authoritative server prices.
- `firebase.json`: Hosting rewrites/cache headers. Firestore and Storage rules deny everything until Phase 2.

## Work sequence

1. Configure the owner's Firebase project, environment, authorized domains and deployment alias.
2. Implement Auth, verified email/recovery, auth-state subscription, protected profile/orders and guest-cart merge.
3. Seed approved catalog/stock. Limit public reads to published products; use trusted admin writes.
4. Implement server checkout with schema validation, authoritative pricing/discounts, rate limits, idempotency and transactional stock reservation. Persist immutable line snapshots and validated addresses.
5. Write and emulator-test owner-scoped order rules. Never let customers set fulfillment/payment status, totals or roles.
6. Implement private receipt uploads with ownership checks, content/size validation, restricted reads and retention. Bank verification remains an audited admin action.
7. Add fulfillment/admin tools and transactional communications. Confirm sender identities and consent.
8. Connect newsletter/contact services with spam protection and unsubscribe. Enable moderated reviews tied to genuine completed purchases.
9. Approve business values and legal copy; replace preview text as a coordinated launch change.
10. Set domain, canonical URLs, absolute OG images, robots/sitemap, and real Product offers/review schema. Preview remains noindex.
11. Test permissions, retries, duplicate orders, inventory conflicts, invalid uploads, payment transitions and deployed mobile checkout.

## Owner information needed

- Confirmed prices, compare-at prices, colour stock and launch promotions.
- Delivery regions, fees, free-delivery threshold, timelines and COD restrictions.
- Bank/account details, payment instructions and verification procedure.
- Returns, exchange, damage, hygiene and cancellation policies.
- Firebase project, domain, legal contact details, support email and privacy decisions.
- Final logo assets if replacing the current typographic wordmark; genuine reviews and demonstration video if available.

Technical reference: [Vite guide](https://vite.dev/guide/) and [Firebase modular setup](https://firebase.google.com/docs/web/setup). No deployment, paid media generation, external messages or production database changes were performed.
