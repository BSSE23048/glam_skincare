# Glam Skincare — Production Deployment & Owner Handoff Guide

Welcome to Glam Skincare! This step-by-step guide will walk you through setting up your free Firebase project, configuring your web application, seeding initial data, creating your administrator account, and deploying to Firebase Hosting.

---

### STEP 1: Create a Firebase Project
- **WHERE TO CLICK:** Open [Firebase Console](https://console.firebase.google.com/) and click **"Add project"** (or **"Create a project"**).
- **WHAT TO ENTER:** 
  - Project name: `glam-skincare` (or your preferred project name).
  - Google Analytics: Optional (you can disable it for now or leave it enabled).
  - Click **"Create project"**.
- **WHAT SUCCESS SHOULD LOOK LIKE:** You see a confirmation screen saying *"Your new project is ready"*. Click **Continue**.

---

### STEP 2: Register a Web Application
- **WHERE TO CLICK:** On your Firebase Project Overview page, click the **Web icon (`</>`)** under *"Get started by adding Firebase to your app"*.
- **WHAT TO ENTER:**
  - App nickname: `Glam Skincare Web App`
  - Check the box: **"Also set up Firebase Hosting for this app"**.
  - Click **"Register app"**.
- **WHAT SUCCESS SHOULD LOOK LIKE:** Firebase displays a code snippet containing your `firebaseConfig` object (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).

---

### STEP 3: Copy Firebase Configuration to `.env.local`
- **WHAT TO ENTER:** 
  In your repository root directory, copy `.env.example` to `.env.local`:
  ```bash
  cp .env.example .env.local
  ```
  Open `.env.local` in your text editor and fill in the values from your Firebase Web App SDK configuration:
  ```env
  VITE_FIREBASE_API_KEY=AIzaSy...
  VITE_FIREBASE_AUTH_DOMAIN=glam-skincare.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=glam-skincare
  VITE_FIREBASE_STORAGE_BUCKET=glam-skincare.appspot.com
  VITE_FIREBASE_APP_ID=1:1234567890:web:...
  VITE_SITE_URL=https://glam-skincare.web.app
  ```
- **WHAT SUCCESS SHOULD LOOK LIKE:** `.env.local` exists in your project root with your actual Firebase API keys. *(Note: `.env.local` is gitignored to protect secrets).*

---

### STEP 4: Enable Email/Password Authentication
- **WHERE TO CLICK:** In Firebase Console left sidebar, click **Build > Authentication**, then click **"Get started"**. Click the **"Sign-in method"** tab, select **Email/Password**.
- **WHAT TO ENTER:** Toggle **Enable** (leave Email link passwordless sign-in disabled). Click **Save**.
- **WHAT SUCCESS SHOULD LOOK LIKE:** Under *Sign-in providers*, **Email/Password** shows status **Enabled**.

---

### STEP 5: Create Cloud Firestore Database
- **WHERE TO CLICK:** In Firebase Console left sidebar, click **Build > Firestore Database**, then click **"Create database"**.
- **WHAT TO ENTER:**
  - Location: Select a region close to Pakistan (e.g. `asia-south1` Mumbai or `europe-west1`).
  - Secure rules: Select **"Start in production mode"**. Click **Create**.
- **WHAT SUCCESS SHOULD LOOK LIKE:** An empty Firestore Database interface opens displaying *Data*, *Rules*, *Indexes*, and *Usage* tabs.

---

### STEP 6: Install & Log in to Firebase CLI
- **WHAT COMMAND TO RUN:** Open your local terminal/PowerShell and run:
  ```bash
  npm install -g firebase-tools
  npx firebase login
  ```
- **WHAT TO ENTER:** Log in via the browser window using the Google account associated with your Firebase project.
- **WHAT SUCCESS SHOULD LOOK LIKE:** Terminal displays: `Success! Logged in as your-email@gmail.com`.

---

### STEP 7: Link Project in Repository
- **WHAT COMMAND TO RUN:** In your terminal inside the project directory:
  ```bash
  npx firebase use --add
  ```
- **WHAT TO ENTER:** Select your created Firebase project from the list, and name the alias `default`.
- **WHAT SUCCESS SHOULD LOOK LIKE:** `.firebaserc` is updated with your production Firebase Project ID.

---

### STEP 8: Deploy Firestore Security Rules & Indexes
- **WHAT COMMAND TO RUN:**
  ```bash
  npx firebase deploy --only firestore:rules,firestore:indexes
  ```
- **WHAT SUCCESS SHOULD LOOK LIKE:** Terminal displays: `✔ Firestore rules deployed successfully` and `✔ Firestore indexes deployed successfully`.

---

### STEP 9: Create Your First Admin Account Securely
- **WHERE TO CLICK & WHAT TO ENTER:**
  1. Open your running local app (`http://localhost:5173/register`) or use Firebase Console Authentication to register your admin user account (e.g. `admin@glamskincare.pk`).
  2. Note down your user UID from *Firebase Console > Authentication > Users*.
  3. Run the secure admin bootstrap script using your terminal:
     ```bash
     node scripts/bootstrap-admin.mjs YOUR_FIREBASE_PROJECT_ID YOUR_USER_UID
     ```
- **WHAT SUCCESS SHOULD LOOK LIKE:** Terminal outputs: `Admin claim assigned to YOUR_USER_UID. Sign out and back in to refresh the token.`

---

### STEP 10: Seed Initial Product & Settings Data
- **WHAT COMMAND TO RUN:** Run the database seed script to populate products and initial store settings into Firestore:
  ```bash
  npm run seed:local
  ```
- **WHAT SUCCESS SHOULD LOOK LIKE:** Output confirms products (`Bye-Bye Makeup`), variants (`Soft White`, `Blush Pink`), and store settings documents created in Firestore.

---

### STEP 11: Run Locally Against Real Firebase
- **WHAT COMMAND TO RUN:**
  ```bash
  npm run dev
  ```
- **WHAT SUCCESS SHOULD LOOK LIKE:** App opens at `http://127.0.0.1:5173` displaying real live products loaded from your Firestore database.

---

### STEP 12: Test Customer Account Registration
- **WHERE TO CLICK:** Navigate to `/register`. Register a test customer account with name, email, and password.
- **WHAT SUCCESS SHOULD LOOK LIKE:** Redirected to `/account`. Your profile name, email, and order history panel display cleanly.

---

### STEP 13: Test Cash on Delivery (COD) Checkout
- **WHERE TO CLICK:** Go to `/product/bye-bye-makeup`, select a variant, click **Buy Now**, select **Cash on delivery**, enter delivery address, and click **Complete Order**.
- **WHAT SUCCESS SHOULD LOOK LIKE:** Navigates to `/order-success/GS-XXXX`. Order number `#GS-XXXX` is displayed. Status shows `Cash on Delivery (Pending)`. In `/account/orders`, order appears with COD status.

---

### STEP 14: Test Manual Online Payment & WhatsApp Handoff
- **WHERE TO CLICK:** Add product to bag, go to `/checkout`, select **Manual Online Payment**, choose **Bank Transfer**, enter shipping address, and click **Complete Order**.
- **WHAT SUCCESS SHOULD LOOK LIKE:** Navigates to `/order-success/GS-XXXX`. Status displays `Awaiting Payment Verification`. Prominent green button **SEND PAYMENT SCREENSHOT ON WHATSAPP** is generated with pre-filled WhatsApp message.

---

### STEP 15: Test Admin Verification & Rejection
- **WHERE TO CLICK:** Log in with your Admin account and navigate to `/admin`.
- **WHAT TO ENTER:**
  1. Click **Payments Queue**. See the order awaiting verification.
  2. Click **VERIFY PAYMENT**. In modal, click **Yes, Verify Payment**.
  3. Customer order status transitions to `PAYMENT VERIFIED` / `Confirmed`.
- **WHAT SUCCESS SHOULD LOOK LIKE:** Dashboard counter updates immediately. In customer account portal, status updates to `PAYMENT VERIFIED`.

---

### STEP 16: Build Production Bundle
- **WHAT COMMAND TO RUN:**
  ```bash
  npm run build
  ```
- **WHAT SUCCESS SHOULD LOOK LIKE:** TypeScript checks pass with zero errors, and compiled bundle is written to `dist/`.

---

### STEP 17: Deploy to Firebase Hosting
- **WHAT COMMAND TO RUN:**
  ```bash
  npx firebase deploy --only hosting
  ```
- **WHAT SUCCESS SHOULD LOOK LIKE:** Terminal displays: `Hosting URL: https://your-project-id.web.app` and `✔ Deploy complete!`.

---

### STEP 18: Verify Live Production Deployment
- **WHERE TO CLICK:** Open your live URL `https://your-project-id.web.app`.
- **WHAT TO CHECK:** Test page navigation (`/shop`, `/product/bye-bye-makeup`, `/cart`, `/checkout`, `/account`, `/admin`). Verify direct page refresh on sub-routes works seamlessly without 404 errors.

---

### STEP 19: Replace Temporary Business & Bank Placeholders
- **WHERE TO CLICK:** Open `src/config/business.ts` or edit the `settings/store` document in Firestore Console.
- **WHAT TO ENTER:** Update real Meezan Bank, Easypaisa, JazzCash account titles, numbers, delivery charges (PKR 200), free shipping threshold (PKR 2,500), and business contact numbers.

---

### STEP 20: Connect Custom Domain Later
- **WHERE TO CLICK:** In Firebase Console left sidebar, click **Build > Hosting**. Under *Custom domains*, click **"Add custom domain"**.
- **WHAT TO ENTER:** Enter your registered domain (e.g. `glamskincare.pk`). Follow the instructions to add TXT and A records to your domain provider's DNS settings (e.g. GoDaddy, Namecheap, PKNIC).
- **WHAT SUCCESS SHOULD LOOK LIKE:** Firebase verifies DNS records and issues an SSL certificate automatically.
