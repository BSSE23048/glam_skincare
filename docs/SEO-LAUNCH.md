# Glam Skincare — Post-Launch SEO & Search Console Playbook

This document provides step-by-step instructions for the owner of **Glam Skincare** to maximize search engine visibility, verify indexing, and manage search console setup after deploying to production.

---

## 1. Connect Your Custom Domain
1. In the **Firebase Console**, go to **Build > Hosting**.
2. Click **Add custom domain**.
3. Enter your domain: `glamskincare.pk` (and `www.glamskincare.pk`).
4. Copy the TXT and A records provided by Firebase into your domain registrar's DNS settings (e.g., PKNIC, GoDaddy, Namecheap).
5. Wait for SSL certificate provisioning (usually 1–24 hours).

---

## 2. Verify Google Search Console (GSC)
1. Visit [Google Search Console](https://search.google.com/search-console/).
2. Add a new Domain property: `glamskincare.pk` (or URL prefix `https://glamskincare.pk`).
3. Select **DNS Record Verification**:
   - Copy the `google-site-verification=...` TXT record into your domain's DNS.
   - Alternatively, add the HTML tag provided by GSC to `index.html` in `<head>`.
4. Click **Verify**.

---

## 3. Submit Your Sitemap
1. In Google Search Console, click **Sitemaps** in the left menu.
2. Under "Add a new sitemap", enter: `sitemap.xml`.
3. Click **Submit**.
4. Confirm that GSC shows status **Success** and detects all indexable URLs:
   - `https://glamskincare.pk/`
   - `https://glamskincare.pk/shop`
   - `https://glamskincare.pk/product/bye-bye-makeup`
   - `https://glamskincare.pk/how-it-works`
   - `https://glamskincare.pk/about`
   - `https://glamskincare.pk/faq`
   - `https://glamskincare.pk/contact`
   - `https://glamskincare.pk/shipping`

---

## 4. Request Manual Indexing for Key Pages
1. Use the **URL Inspection** tool at the top of Google Search Console.
2. Enter `https://glamskincare.pk/` and click **Request Indexing**.
3. Repeat for:
   - `https://glamskincare.pk/product/bye-bye-makeup`
   - `https://glamskincare.pk/shop`
   - `https://glamskincare.pk/how-it-works`

---

## 5. Verify Canonical URLs & Meta Tags
1. Open your live site in Chrome.
2. Right-click > **View Page Source** or inspect `<head>`.
3. Verify:
   - `<link rel="canonical" href="https://glamskincare.pk/...">` is present on every page.
   - `<meta name="robots" content="index, follow, max-image-preview:large">` is present on public pages.
   - `<meta name="robots" content="noindex, nofollow">` is present on `/admin`, `/checkout`, `/cart`, `/account`, and `/login`.

---

## 6. Test Structured Data (JSON-LD)
1. Open [Google Rich Results Test](https://search.google.com/test/rich-results).
2. Test `https://glamskincare.pk/product/bye-bye-makeup`.
3. Confirm that **Product** structured data is valid with:
   - Name: `Bye-Bye Makeup`
   - Brand: `Glam Skincare`
   - Price: `850` / Currency: `PKR`
   - Availability: `InStock`
4. Test `https://glamskincare.pk/faq` to confirm **FAQPage** structured data.

---

## 7. Connect Google Merchant Center (Free Product Listings)
1. Create a free account at [Google Merchant Center](https://merchants.google.com/).
2. Verify your domain `glamskincare.pk`.
3. Set up **Free Listings** for Pakistan.
4. Add your hero product:
   - **Title:** Glam Skincare Bye-Bye Makeup Reusable Microfiber Pad
   - **Price:** PKR 850
   - **Link:** `https://glamskincare.pk/product/bye-bye-makeup`
   - **Image Link:** `https://glamskincare.pk/images/pink-pad.jpeg`
   - **Availability:** In Stock
   - **Shipping:** PKR 200 (Free above PKR 2,500)

---

## 8. Post-Launch Organic Growth Strategy
- **Instagram & Social Signals:** Link to `glamskincare.pk` in `@Glamskincarepk` Instagram bio.
- **Customer Reviews:** As customers purchase and test the Bye-Bye Makeup pad, encourage approved reviews; genuine review schema will strengthen product listings organically.
- **Local Citations:** Add Glam Skincare to Google Business Profile for Pakistan local search discovery.
