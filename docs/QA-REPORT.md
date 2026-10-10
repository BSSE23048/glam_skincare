# Glam Skincare release audit — 9 October 2026

Scope: existing repository, Chrome, local Firebase Authentication and Firestore emulators. Final browser checks use a built QA bundle on `127.0.0.1:5175`, not the owner's Firebase project. No deployment, real payment, WhatsApp message, production mutation or billing change was performed.

## 1. Initial bugs found

The following ledger includes defects found in the original implementation and regressions exposed while correcting it. Static findings are distinguished from browser evidence below.

| ID | Severity | Defect and correction |
|---|---|---|
| B01 | P0 | Email-based administrator bypass in frontend/rules; replaced with custom-claim-only authorization. |
| B02 | P0 | Checkout could show local success without writing an order; success now follows the Firestore transaction. |
| B03 | P1 | Forced token refresh inside token-change callback; removed reentrant refresh and guarded stale callbacks. |
| B04 | P1 | Admin tab state ignored direct URLs/refresh; URL now selects the tab. |
| B05 | P1 | Auth redirects before later hooks in order/checkout flows; hooks now run consistently before redirects. |
| B06 | P1 | Homepage dereferenced the first product before the live catalog loaded; empty/loading catalog is now safe. |
| B07 | P1 | Confirming two colours wrote competing product snapshots; one grouped product update now preserves both deductions. |
| B08 | P1 | Stock edit replaced the variants array with the first variant; editor now updates each variant independently. |
| B09 | P1 | Product save published private costs; costs now live in admin-only documents and rules reject public cost fields. |
| B10 | P1 | Archive updated only one SKU; all variants now follow product activation. |
| B11 | P1 | Static catalog prices/stock and seed fallback produced stale purchasable items; cart/search/recently-viewed use live catalog data. |
| B12 | P1 | Five-line checkout exceeded Firestore's rule-expression budget; equivalent exact-map validation now passes. |
| B13 | P2 | Short random order IDs risked collisions; IDs now use 16 hexadecimal UUID characters. |
| B14 | P2 | Admin order-list failures disappeared silently; visible retry/error state added. |
| B15 | P2 | Payment actions accepted inappropriate orders and empty rejection reasons; service validates the workflow. |
| B16 | P2 | Phone tracker queried orders without customer ownership; query is now scoped to the signed-in UID. |
| B17 | P2 | Settings refresh showed initial defaults instead of saved numeric values; form waits for settings initialization. |
| B18 | P2 | Settings save overwrote fields absent from the form; those settings are now preserved. |
| B19 | P2 | Hardcoded shipping information and rigid admin layout; live shipping values and responsive admin layout added. |
| B20 | P2 | Analytics invented a PKR 320 cost and counted non-delivered orders as revenue; delivered merchandise revenue and explicitly estimated margins replace it. |
| B21 | P2 | Contact form claimed an unsent message was received; it now prepares an explicitly unsent WhatsApp draft. |
| B22 | P3 | Stale Storage/preview documentation and missing backend-test command; current architecture/runbooks and release commands added. |

## 2. P0/P1/P2/P3 counts

22 defect groups addressed: **P0: 2, P1: 10, P2: 9, P3: 1**. These are audit-ledger counts, not a claim that every possible defect has been discovered. Production verification gaps and incomplete features are listed separately in section 26.

## 3. Root cause of admin refresh white screen

Static inspection found a reentrant `getIdTokenResult(true)` inside `onIdTokenChanged`, role/loading coupling to the profile listener, and admin tab state detached from the URL. Related auth-dependent early returns also changed hook order in customer order/checkout components. These are concrete defects, but the original owner's exact production white-screen incident was **not reproduced against an untouched pre-fix production build**. Its singular production cause cannot honestly be proven from this run.

A separate intermittent homepage failure was reproduced during browser testing: `products[0]` was undefined before the live catalog arrived. That render exception is fixed.

## 4. Exact fix for admin refresh

Auth reads the current token without forcing another token event, rejects stale callbacks, resolves the role before rendering protected content, and fails closed if Firebase is unavailable. Admin tabs derive from `/admin/*`. Admin rendering does not begin with an invisible fade. Existing Suspense and error boundaries provide loading/recovery UI. Firebase Hosting already had the correct catch-all SPA rewrite; it was preserved. No arbitrary delay was added.

## 5. Root cause of customer order not appearing in admin

Checkout only called `createOrder` when a Firebase user happened to exist, then always saved a browser-local order and navigated to success. Guest/local orders never entered the Firestore collection watched by admin. Order details also depended on local data, and the old sanitizer only accepted `PREVIEW-*` identifiers. Admin snapshot errors were suppressed.

## 6. Exact order-flow fix

Checkout requires authentication, validates delivery fields, reads authoritative SKU prices/stock and store settings, and commits the order plus checkout throttle in a Firestore transaction. It clears the cart and redirects only after success. A stable per-attempt ID and submission lock prevent duplicate clicks from creating separate orders. Customer history, detail/success pages and admin all read the same `orders/{id}` documents. Order lines are immutable purchase snapshots; later catalog edits do not rewrite them.

## 7. Customer workflows tested

Guest checkout protection; customer sign-in; administrator access denial; registration validation and persistence; wrong password; password recovery; both-colour cart; quantities/removal/refresh; COD/manual checkout; order history/detail refresh; live confirmation/delivery/rejection; WhatsApp link encoding. Final individual statuses are recorded in the machine-readable release results.

## 8. Admin workflows tested

Login redirect, every management route/direct refresh, account-to-admin redirect, sign-out protection, order visibility and details, COD status progression, manual verification/rejection, profile persistence, product create/edit/archive/reactivate, private costs, variant stocks, review approve/hide, shipping settings and manual-payment disablement.

## 9. Every major route refresh result

PASS in the built preview: `/`, `/shop`, `/product/bye-bye-makeup`, `/how-it-works`, `/about`, `/faq`, `/contact`, `/login`, `/register`, `/cart`, `/shipping`, `/privacy`, `/terms`, and a missing route.

PASS with restored admin session: `/admin`, `/admin/products`, `/admin/inventory`, `/admin/orders`, `/admin/payments`, `/admin/customers`, `/admin/reviews`, `/admin/analytics`, `/admin/settings`, `/admin/profile`.

Customer account and individual order refresh are exercised in auth/order tests. Guest `/checkout` redirects to login. Public URLs were tested locally; the deployed production Hosting rewrite is **NOT EXECUTED**.

## 10. Product CRUD results

PASS: create a temporary QA product with Pink/White variants; verify database persistence and private cost isolation; edit price and both stocks; refresh; check storefront price and disabled White purchase; archive every SKU; verify product becomes unavailable; reactivate; safely delete only the test fixture. The service additionally validates positive prices, nonnegative whole stock, compare-at prices, unique SKUs and slugs.

## 11. Variant/inventory results

PASS: an order containing one Pink and one White decrements each SKU and each corresponding product variant exactly once at confirmation. Separate writes are grouped transactionally. Rules deny customer stock writes and negative admin inventory. Product editor preserves the second variant. Expanded matrix results are recorded in the final supplement below.

Inventory is reserved on confirmation, not at initial checkout. Pending orders may compete for remaining stock; the confirmation transaction rejects insufficient stock. Cancellation releases reserved inventory. Concurrent load/stress testing is **NOT EXECUTED**.

## 12. Cart results

PASS: both colours, selected variant snapshots, quantity increase/decrease, remove, refresh persistence, live totals, stock cap and out-of-stock reconciliation. Per-variant quantity is capped at 10 to match the rules. Unit tests cover malformed data, merging/flooring/capping, shipping and discount math. Discount-code redemption is not implemented and is not reported as passing.

## 13. Checkout results

PASS: authenticated checkout, required delivery values, normalized Pakistani phone, authoritative amount, COD/manual selection, database persistence, success-page refresh and customer/admin visibility. Manual payment can be disabled in settings. The submission lock and stable ID are implemented; deliberate network-loss/duplicate-click stress testing is **NOT EXECUTED**.

## 14. COD order end-to-end result

PASS, built-preview evidence: **GS-4D281C921BAB41F0**, QA Customer, one Blush Pink and one Soft White at PKR 850 each, subtotal PKR 1,700, shipping PKR 200, total **PKR 1,900**. Firestore/customer/admin agree. Admin opened details, confirmed, processed, shipped and delivered it. Customer detail reflected Delivered. No screenshot-payment CTA appeared for COD.

## 15. Manual payment end-to-end result

PASS, built-preview evidence: **GS-488F5C41B2314827**, QA Customer, the same two variants/quantities and **PKR 1,900** total. Initial payment status was awaiting verification and order status payment verification. The order existed before the WhatsApp step. The link includes `923224729343`, customer name, order ID and amount. No WhatsApp message or money was sent.

## 16. Admin order visibility result

PASS: both IDs were read independently using the emulator Admin SDK, shown in customer history and found in admin Orders before and after refresh. This proves database visibility, not just success-page rendering.

## 17. Payment verification result

PASS: admin verified the manual order; Firestore became `paymentStatus=verified`, `orderStatus=confirmed`, with `verifiedBy=local-admin`, a non-null `verifiedAt`, a timeline entry and both stock deductions. A separate emulator fixture was rejected with a reason; the customer saw that reason. No receipt upload is used.

## 18. Sign-out result

PASS: admin sidebar sign-out redirects to login and a fresh protected admin URL requires login. Customer sign-out is exercised during registration/recovery. Other sign-out buttons share the same handler; each duplicate placement and browser Back combination was not independently exhaustively exercised.

## 19. Broken controls fixed

Product stock fields no longer delete another colour. Archive affects every colour. Admin navigation preserves the requested route. Settings retain saved values on refresh. Checkout cannot create fake success. Order tracking enforces ownership. Contact no longer claims delivery. Mobile menu, search, image zoom/Escape, cart controls and profile save were clicked in browser tests.

## 20. Firestore/rules issues found

Removed email admin bypass; isolated private costs; added admin-only slug reservations; restricted missing-order reads to signed-in users; enforced authoritative complete order maps and empty initial history; denied customer status/stock changes; preserved verified-review checks; reduced evaluation overhead enough for five-line orders; missing settings fail closed. Eight emulator rules tests pass, including expected permission-denied cases. Updated production rules/indexes have **not** been deployed. Existing public cost fields require migration before applying the stricter write rules.

## 21. Console/runtime errors found and fixed

The empty-catalog homepage exception is fixed. Static hook-order and token-refresh hazards were corrected. The final browser fixture captures page exceptions and requires an empty list. Earlier test failures included ambiguous selectors, a reset email not refilled by the test, settings initialization, development reload interference and corrupt trace ZIP writes in the OneDrive workspace. The final suite uses a built preview, JSON output and failure screenshots. Expected rules-test permission errors are successful denial assertions, not application crashes.

## 22. Responsive test results

PASS: home, shop, product, login and cart have no document-level horizontal overflow at 320, 375, 390, 430, 768, 1024 and 1440 px. Admin profile/navigation pass at 320, 390, 768 and 1440 px. Admin tables have local horizontal scrolling. The admin profile screenshot was visually inspected. All admin modal states at every width and a full accessibility audit are **NOT EXECUTED**.

## 23. Automated tests added

`tests/release.spec.ts`: release browser workflows. `tests/rules.test.mjs`: eight security/integrity tests. `playwright.release.config.ts`: emulator-only built-preview target. Default Playwright configuration routes to this current suite. Historical guest-checkout tests are retained for reference, not counted as current evidence. See `QA-MATRIX.md` for scope and unsupported controls.

## 24. Exact commands/tests actually run

```powershell
npm.cmd run emulators
npm.cmd run seed:local
npm.cmd run dev -- --mode qa --port 5174
node node_modules/typescript/bin/tsc -b
npm.cmd run lint
npm.cmd test
npm.cmd run test:rules
npm.cmd run build
npm.cmd run build:qa
node node_modules/vite/bin/vite.js preview --outDir .audit/qa-dist --port 5175 --host 127.0.0.1
npm.cmd run test:release
npm.cmd exec playwright test -- --config playwright.release.config.ts
git diff --check
```

Targeted browser reruns also used `--grep` for checkout, CRUD, responsive and authentication cases. Initial sandboxed Vite/Vitest attempts failed due filesystem access; the authorized runs outside that restriction succeeded. A preview startup command timed out and was replaced with the direct Vite command above. These failed attempts are not counted as passes.

## 25. Build result

TypeScript and the built QA bundle pass. Production build, lint and unit/rules results are recorded in the final verification supplement below. No build was deployed.

## 26. Remaining known issues and coverage limits

| Severity | Route/scope | Reproduction, expected versus actual | Cause / next action |
|---|---|---|---|
| P1 release gate | Owner Firebase project | Run the production workflow: it was intentionally not executed; production claims/rules/indexes/data remain unverified. | Review/migrate existing catalog data, authorize the admin claim and run a staging smoke test before release. |
| P1 conditional data migration | Existing public products/SKUs | Older saves may contain cost fields. Expected private costs; actual production contents were not read. Stricter writes reject such documents. | Inspect with trusted owner tooling, move costs privately and remove public fields; do not reseed real customer data. |
| P2 feature gap | `/account` shipping tab | Open saved shipping: expected editable defaults from its copy, actual UI only shows a profile summary. | Add address editing/autofill in a separate scoped feature, or change its explanatory copy. |
| P2 feature gap | Customer reviews | Delivered customer has no review-submission form; rules support it, admin moderation works. | Add the submission UI if launch requires it. |
| P2 limitation | `/admin/analytics` | Changing current product costs changes estimated historical margin. Expected accounting-grade frozen costs; actual values use current private costs. | Treat as estimates; add private per-order cost snapshots before accounting use. |
| P2 feature gap | Cart discount field | Enter a valid-looking code: actual handler rejects every code; redemption has no backend. | Remove the optional input or implement authoritative promotion rules before advertising codes. |
| P3 feature gap | Newsletter | Submit email: UI explicitly says signups open at launch and does not store it. | Connect a subscription workflow only if required. |

The audit does not claim that every permutation of every control passed. Network-offline recovery, high-concurrency inventory stress, production email delivery, every modal/width, full keyboard/accessibility coverage and external courier/refund flows remain NOT EXECUTED. External WhatsApp/Instagram destinations were not used to send messages.

## 27. Manual owner actions still required

Before launch, replace/review the provisional prices, stock, shipping/returns, bank details and domain; verify the intended Firebase project and authorized domains; assign the admin custom claim using trusted credentials; migrate legacy public costs and reconcile SKU states; apply reviewed rules/indexes only as part of an authorized release. A local service-account filename was present; its contents were not printed and Git checks found no tracked matching credential file. Keep private keys outside the repository and rotate only if actually exposed. No owner input was required to continue local QA.

## 28. Firebase services currently required

Firebase Authentication and Cloud Firestore. Firebase Hosting is the configured SPA host. Local testing uses Auth/Firestore emulators. The implementation does not require enabling billing or Cloud Functions. Actual usage quotas and production availability were not certified by this audit.

## 29. Whether Firebase Storage is actually required

**No.** Product images use static paths/HTTPS URLs. Payment screenshots are sent by the customer through WhatsApp. There is no required Firebase Storage upload.

## 30. Release verdict

**NOT READY FOR DEPLOYMENT to the owner's production store yet.** Core local workflows have been exercised and corrected, but production authorization/data migration/configuration and the staging release gate are unverified. The feature/coverage limits above must be accepted or completed before claiming a comprehensive launch sign-off. Nothing was deployed.

## Final verification supplement

Final verification:

- Full built-preview suite: **12 passed, 0 failed, 0 skipped, 0 flaky** in 171.9 seconds. Evidence: `.audit/release-core-results.json`.
- Expanded CRUD/inventory regression: **1 passed** in 53.2 seconds. It exercised Pink/White 5/2, 5/0, 0/5, 0/0 and restoration; the correct purchase button enabled/disabled for each colour. A live price update from PKR 975 to PKR 990 reached an existing cart, checkout and the Firestore order's `unitPrice`. Archiving cleared the stale cart. Evidence: `.audit/release-inventory-results.json`.
- Supplemental public-controls regression: **1 passed** in 6.9 seconds, covering catalog search/reset/sort/colour/stock filters, FAQ open/close, an unsent contact draft and signed-out order tracking. Evidence: `.audit/release-results.json`.
- These represent **13 distinct browser workflows**; the CRUD workflow was extended and rerun separately after the 12-test suite.
- **8/8 Firestore rules tests passed; 6/6 unit tests passed.** Expected permission-denied logs were asserted.
- **Production build, QA build, TypeScript, lint and `git diff --check` passed.** Git printed only line-ending normalization warnings.
- Emulator order snapshots are preserved in `.audit/order-evidence.json`. The actual two orders remain in the emulator for inspection. Temporary QA product fixtures from failed attempts were cleaned only in the demo emulator.
- `.audit/admin-profile.png` was visually inspected. Generated evidence is intentionally ignored by Git.

The new stock assertion initially used an unsupported matcher option; it was corrected to explicit enabled/disabled assertions before the passing rerun. No application behavior was weakened to satisfy tests.
