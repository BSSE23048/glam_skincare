# Glam Skincare — Store Owner & Admin Guide

Welcome to your Glam Skincare administration manual! This guide provides simple, step-by-step instructions for operating your online store, managing products, fulfilling orders, verifying payments, and updating store settings.

---

## 1. Admin URL & Access
- **ADMIN URL:** `https://glamskincare.pk/admin` (or `http://127.0.0.1:5173/admin` when running locally)
- **LOGIN METHOD:** Email & Password sign-in at `/login`.
- **AUTHORIZATION MODEL:** Uses secure Firebase Custom User Claims (`admin: true`).

> [!IMPORTANT]
> Admin privileges are bound strictly to your authenticated Firebase user ID on the server side using Firebase Firestore security rules. There are **no hardcoded passwords** and **no client-side bypasses**.

---

## 2. First Admin Account Setup
Follow these simple steps to set up your primary owner account:

1. **Register Your Account:**
   - Go to `https://glamskincare.pk/register` (or register directly in **Firebase Console > Authentication > Users**).
   - Enter your email address (e.g. `owner@glamskincare.pk`) and a strong password.

2. **Get Your User UID & Service Account Key:**
   - Open **Firebase Console > Build > Authentication > Users**.
   - Locate your registered email and copy your **User UID** string (e.g. `qQko2Z70joVT5hpFLccxyzRs9Nj1`).
   - Open **Firebase Console > Project Settings (gear icon) > Service accounts** tab.
   - Click **"Generate new private key"** and save the downloaded JSON file into your project folder as `serviceAccountKey.json`.

3. **Assign Admin Claim:**
   - Open your local computer terminal in the project folder and run:
     ```bash
     node scripts/bootstrap-admin.mjs YOUR_FIREBASE_PROJECT_ID YOUR_USER_UID
     ```
   - *Example:*
     ```bash
     node scripts/bootstrap-admin.mjs glam-skincare qQko2Z70joVT5hpFLccxyzRs9Nj1
     ```
   - Terminal outputs: `SUCCESS! Admin claim assigned to user UID: ...`

4. **Sign In & Access Admin Dashboard:**
   - Sign out from the storefront if signed in.
   - Navigate to `/login`, enter your email and password, then navigate to `/admin`.
   - Your full Store Administration panel will open.

---

## 3. Password Reset & Account Management
- **To Reset Password:**
  - On the `/login` page, click **"Forgot your password?"** or request a reset email from **Firebase Console > Authentication > Users > Reset Password**.
- **To Add Additional Admin Users:**
  - Ask the staff member to create an account at `/register`.
  - Copy their UID from Firebase Console.
  - Run `node scripts/bootstrap-admin.mjs YOUR_FIREBASE_PROJECT_ID STAFF_USER_UID`.
- **To Revoke Admin Access:**
  - Run the node script with `{ admin: false }` or remove the user from Firebase Console.

---

## 4. Product & Catalog Management
In your Admin Dashboard under the **Products** tab:

1. **Create New Product:**
   - Click **+ Create Product**.
   - Fill in Name, Subtitle, Category, Price (PKR), Compare-at Price (for discount calculation), Stock Quantity, Material, Description, and Care Instructions.
   - Click **Save Product**.

2. **Edit Existing Product & Stock:**
   - Click **Edit** on any product card.
   - Update price, compare-at price, stock quantity, or product descriptions.
   - Click **Save Product**. Changes instantly update across your storefront and Firestore database.

3. **Activate or Deactivate Products:**
   - Click **Deactivate** on any product card to immediately hide it from public shop listings without deleting sales history. Click **Activate** to restore it.

---

## 5. Product Image Architecture
- **Free-First Architecture:** To avoid monthly Firebase Storage billing fees, product images utilize static local high-resolution photography paths (e.g. `/images/pink-pad.jpeg`, `/images/white-pad.jpeg`, `/images/glam-packaging.jpeg`).
- **Custom Image URLs:** You can also specify any HTTPS web image URL in product creation/editing.
- *Optional Paid Upgrade:* If you choose to enable Firebase Cloud Storage in the future, image files can be uploaded directly to Cloud Storage buckets.

---

## 6. Order Management & Fulfillment Workflow
In your Admin Dashboard under the **Orders** tab:

1. **Search & Filter:**
   - Filter orders by status (*Pending, Awaiting Verification, Confirmed, Processing, Shipped, Delivered, Cancelled*).
   - Search by Order Number (`GS-XXXX`), Customer Name, or Phone Number.

2. **Inspect Order Details:**
   - Click **Details** on any order card to view full delivery address, item breakdown, payment status, verification timestamps, and timeline audit history.

3. **Update Fulfillment Status:**
   - Click **Confirm Order** (for COD orders).
   - Click **Mark Processing** -> **Mark Shipped** -> **Mark Delivered**.
   - Status updates are reflected in customer account dashboards.

---

## 7. Manual Online Payment Verification Workflow
For orders placed with **Manual Online Payment (Bank Transfer / Easypaisa / JazzCash)**:

1. Customer receives Order Number (`GS-XXXX`) and clicks **SEND PAYMENT SCREENSHOT ON WHATSAPP**.
2. Message arrives on your store WhatsApp (`+92 322 4729343`) containing order number, customer name, and total amount.
3. Open **Admin Dashboard > Payments Queue**.
4. Check your bank statement or WhatsApp screenshot:
   - **IF VERIFIED:** Click **VERIFY** -> **Yes, Verify Payment**. Order status updates to `Confirmed` / `PAYMENT VERIFIED`. Stock is reserved.
   - **IF REJECTED:** Click **REJECT**, select or enter reason (e.g. *Payment not received*), and confirm. Status updates to `Payment Rejected`.

---

## 8. Customer Review Moderation
In your Admin Dashboard under the **Reviews** tab:
- All submitted customer reviews default to `pending` status.
- Review list displays author, rating (1–5 stars), and review text.
- Click **Approve** to publish review publicly on product page with **Verified Purchase** badge.
- Click **Hide** to suppress fake or spam reviews.

---

## 9. Store & Business Settings
In your Admin Dashboard under the **Settings** tab:
- Update WhatsApp contact number and display format (`+92 322 4729343`).
- Update Instagram handle (`Glamskincarepk`).
- Adjust shipping fees (default PKR 200) and free shipping threshold (default PKR 2,500).
- Update delivery estimate (default *3–5 working days*).
- Toggle COD or Manual Online Payment options.
- Update Meezan Bank, Easypaisa, or JazzCash account titles and numbers.
- Click **Save Store Settings**. Updates take effect immediately.
