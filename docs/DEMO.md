# Demonstrating Glam Skincare

Use synthetic customer information and a local Firebase emulator project. Never place a real order, send a WhatsApp message or take a payment for a portfolio demonstration.

## Five-minute walkthrough

1. Start the local Auth and Firestore emulators and seed the demo catalog using [the local setup](PHASE-2.md).
2. Open the storefront on a phone-sized viewport, inspect a product and add both colour variants.
3. Sign in with a seeded customer account, submit a COD order and refresh the order detail page.
4. Sign in with a seeded administrator account, inspect the same order and progress its fulfillment.
5. Return to the customer account and show the updated status.
6. Demonstrate a rejected action: the customer cannot open the admin workspace or read another customer's order.

Record the actual result of each step. Do not label this walkthrough as passed until it has been run against the revision being shown.

## Screenshots to capture

- Storefront and product detail at mobile width.
- Cart with both variants and a visible total.
- Customer order confirmation/history.
- Admin order management using only seeded records.

Use descriptive image captions and remove tokens, real names, addresses, phones and payment information. No screenshots are currently supplied by this document.

## Evidence and limitations

The repository contains unit, browser and Firestore-rules tests. The historical [QA report](QA-REPORT.md) documents a previous emulator audit, not a guarantee for every later commit or production deployment.

The automated Quality workflow runs lint, unit tests and the production build. The separate Emulator demo workflow runs the rules and browser release suites against synthetic local data. Its result must be checked for the exact revision being demonstrated. Neither workflow verifies production Firebase permissions, bank details or real payments. Manual payment verification uses WhatsApp; payment gateway processing and discount redemption are outside the current workflow.


## Reproduce the CI demo locally

Use Node 22 and Java 21. After `npm ci`:

```sh
npx playwright install --with-deps chromium
npm run build:qa
npx firebase emulators:exec --only auth,firestore --project demo-glam-skincare "npm run seed:local && npm run test:rules && npm run test:release && npm run seed:local && node scripts/screenshots.mjs"
```

The QA build reads `.env.qa` and connects to localhost Auth and Firestore emulators. The seed accounts are synthetic emulator accounts, not production credentials. The screenshot script starts its own QA preview on port 5176. Do not point it at a deployed storefront.

Each workflow run retains `.audit/portfolio` screenshots and the browser JSON summary as `synthetic-demo-evidence` for seven days. Download these from the Actions run; inspect the screenshots before including them in a public case study. A failed test stops the sequence, so failed runs may have no portfolio screenshots. No emulator database export or signed-in browser state is uploaded.
