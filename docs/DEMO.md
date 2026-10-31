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

The automated Quality workflow runs lint, unit tests and the production build. It does not yet run browser tests, verify production Firebase permissions, validate bank details or demonstrate real payments. Manual payment verification uses WhatsApp; payment gateway processing and discount redemption are outside the current workflow.
