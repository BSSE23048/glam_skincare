# Glam Skincare — E-Commerce Platform

**Brand:** Glam Skincare  
**Tagline:** Glow. Care. Confidence.  
**Primary Product:** Bye-Bye Makeup reusable microfiber makeup-removal pad.

A high-performance, mobile-first beauty storefront built with React 19, TypeScript, Vite, Framer Motion, and Firebase (Authentication & Cloud Firestore). Designed to operate within Firebase's free Spark plan using a direct WhatsApp payment verification workflow.

---

## Technical Stack

- **Frontend:** React 19, React Router v7, TypeScript, Framer Motion, Lucide React
- **Styling:** Custom responsive CSS design system (Blush pink, warm white, charcoal, nude palette)
- **Backend / BaaS:** Firebase Authentication, Cloud Firestore
- **Hosting:** Firebase Hosting (Static SPA with rewrites)
- **Communication:** Contextual WhatsApp Deep Links (`wa.me`)
- **Testing:** Vitest (Unit tests), Playwright (E2E & Accessibility), Axe Core

---

Current release verification and known limits: [QA report](docs/QA-REPORT.md), [test matrix](docs/QA-MATRIX.md), and [current architecture/local setup](docs/PHASE-2.md). Browser tests require running local emulators, `npm run seed:local`, and `npm run build:qa`; they use the demo project on a built preview at port 5175.

## Quick Start & Local Development

### Prerequisites
Node.js 22 and npm installed. Local Firebase testing also requires Java 21.

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm test

# Run Playwright E2E tests
npm run test:e2e

# Production build & type check
npm run build
```

The application will run locally at `http://127.0.0.1:5173`.

---

## Free-First Architecture & Design Principles

Glam Skincare is engineered to run at **zero recurring infrastructure cost** during launch:

1. **Firebase Authentication:** Handles customer registration, sign-in, and administrator session tokens.
2. **Cloud Firestore:** Real-time database for users, products, categories, orders, reviews, and site settings.
3. **No Payment Screenshot Uploads:** Customers complete manual online payments (Bank Transfer / Easypaisa / JazzCash) and send verification screenshots directly via WhatsApp. No paid Cloud Storage or Cloud Functions required.
4. **Static Product Imagery:** High-resolution product photography is stored directly in `/public/images`.
5. **WhatsApp Integration:** Dynamic deep-link generator formats pre-filled contextual messages for support, product inquiries, and payment verification.

---

## Payment & Order Workflows

### 1. Cash on Delivery (COD)
- Customer completes checkout with COD selected.
- Order is created in Firestore with:
  - `paymentMethod = "cod"`
  - `paymentStatus = "cod_pending"`
  - `orderStatus = "pending"`
- Confirmation screen displays order details and estimated delivery time.

### 2. Manual Online Payment (Bank / Easypaisa / JazzCash)
- Customer selects online payment method.
- Store bank details, account title, and IBAN placeholders are displayed.
- Order is created in Firestore with:
  - `paymentMethod = "manual_online_payment"`
  - `paymentStatus = "awaiting_verification"`
  - `orderStatus = "payment_verification"`
- Customer receives readable Order Number (e.g. `#GS-1048`) and a large **SEND PAYMENT SCREENSHOT ON WHATSAPP** CTA.
- Clicking the CTA opens WhatsApp with a pre-formatted message:
  ```text
  Hi Glam Skincare! 🤍

  I have placed an online payment order.

  Order Number: #GS-1048
  Order Amount: Rs. 2,499
  Name: Sara Ahmed

  I am sending my payment screenshot here for verification.

  Please confirm my payment and process my order.

  Thank you!
  ```

---

## Admin Dashboard (`/admin`)

The admin portal is protected via Firebase Auth custom claims (`request.auth.token.admin == true`).

### Features:
- **Dashboard & Notification Center:** Real-time counters for New Orders, Payments Awaiting Verification, Low Stock, and Reviews Pending Moderation.
- **Payment Verification Queue (`ADMIN > PAYMENTS`):** Lists orders awaiting review. Options to:
  - Contact customer directly on WhatsApp with pre-filled order context.
  - **Verify Payment:** Confirmation modal sets `paymentStatus = "verified"` and `orderStatus = "confirmed"`.
  - **Reject Payment:** Reason selection (Payment not received, Incorrect amount, etc.) sets `paymentStatus = "rejected"` and `orderStatus = "payment_rejected"`.
- **Order Management:** Search by order number/phone, filter by status, update fulfillment steps (Processing, Shipped, Delivered, Cancelled).
- **Product & Review Management:** Update prices, stock thresholds, and moderate customer reviews.

### Bootstrap Admin Account (First-Time Setup)

To assign administrator privileges to your user account:

```bash
# Format: node scripts/bootstrap-admin.mjs <FIREBASE_PROJECT_ID> <USER_UID>
node scripts/bootstrap-admin.mjs your-project-id YOUR_FIREBASE_UID
```

*(Note: Sign out and back in after running the script to refresh Auth ID tokens).*

---

## Environment Variables (`.env.example`)

Copy `.env.example` to `.env.local`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_APP_ID=your-app-id
VITE_SITE_URL=https://glamskincare.pk
```

If Firebase credentials are absent, the site operates seamlessly in local fallback preview mode.

---

## Deployment to Firebase Hosting

```bash
# Log in to Firebase CLI
npx firebase login

# Target your production Firebase project
npx firebase use --add

# Deploy hosting and security rules
npx firebase deploy
```

---

## Future Optional Upgrades

If the business expands and requires paid automation:
1. **Firebase Storage:** Enable Cloud Storage rules for automatic in-app payment screenshot uploads.
2. **Payment Gateway:** Integrate Stripe / PayFast for automated instant card processing.
3. **Transactional Email:** Connect SendGrid / Postmark for automated order confirmation emails.
