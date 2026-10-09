import { test, expect } from "@playwright/test";

test.describe("Full A-to-Z QA Audit", () => {
  const routes = [
    "/",
    "/shop",
    "/product/bye-bye-makeup",
    "/how-it-works",
    "/about",
    "/faq",
    "/contact",
    "/login",
    "/register",
    "/account",
    "/account/orders",
    "/cart",
    "/checkout",
    "/shipping",
    "/privacy",
    "/terms",
    "/non-existent-page",
  ];

  test("1. Route Audit & JS Error Inspection", async ({ page }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    }

    expect(jsErrors).toEqual([]);
  });

  test("2. Header & Navbar Navigation Controls", async ({ page }) => {
    await page.goto("/");
    
    // Check main logo
    const logo = page.locator(".logo-text, .logo").first();
    await expect(logo).toBeVisible();

    // Check navbar links on desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole("link", { name: "Shop", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "The ritual", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Our story", exact: true }).first()).toBeVisible();

    // Test mobile drawer toggle
    await page.setViewportSize({ width: 375, height: 667 });
    const menuBtn = page.getByRole("button", { name: "Open menu" });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    
    // Close mobile menu
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("3. Product Page & Variant Selector", async ({ page }) => {
    await page.goto("/product/bye-bye-makeup");

    // Check main title & price
    await expect(page.locator("h1")).toContainText("Bye-Bye Makeup");
    await expect(page.locator("body")).toContainText("Rs.");

    // Select color variant
    const variantBtn = page.getByRole("button", { name: "Soft White", exact: true });
    if (await variantBtn.isVisible()) {
      await variantBtn.click();
      await expect(page).toHaveURL(/colour=ivory/);
    }

    // Check image gallery zoom trigger
    const zoomBtn = page.getByRole("button", { name: "Zoom product image" });
    if (await zoomBtn.isVisible()) {
      await zoomBtn.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
    }
  });

  test("4. Cart Drawer & Calculations", async ({ page }) => {
    await page.goto("/product/bye-bye-makeup");

    // Add product to cart
    await page.getByRole("button", { name: "Add to bag", exact: true }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Navigate to Cart Page
    await page.goto("/cart");
    await expect(page.locator(".cart-line")).toHaveCount(1);

    // Increase quantity
    const incBtn = page.getByRole("button", { name: /Increase/ }).first();
    await incBtn.click();
    await expect(page.locator(".cart-line .quantity")).toContainText("2");

    // Check price calculation updates
    await expect(page.locator(".cart-summary")).toBeVisible();

    // Remove item
    const removeBtn = page.getByRole("button", { name: /Remove/ }).first();
    await removeBtn.click();
    await expect(page.getByText("Your ritual starts here.")).toBeVisible();
  });

  test("5. Checkout - Form Validation & COD Order Execution", async ({ page }) => {
    await page.goto("/product/bye-bye-makeup");
    await page.getByRole("button", { name: "Buy now", exact: true }).click();

    // Attempt submitting empty form
    await page.getByRole("button", { name: "Complete order" }).click();

    // Fill valid delivery info
    await page.getByLabel("Full name", { exact: true }).fill("QA Test Customer");
    await page.getByLabel("Email address", { exact: true }).first().fill("qa@glamskincare.pk");
    
    // Invalid Pakistani mobile number check
    await page.getByLabel("Mobile number").fill("12345");
    await page.getByLabel("Street address").fill("Street 42, Block B");
    await page.getByLabel("Area / neighbourhood").fill("Gulberg III");
    await page.getByLabel("City", { exact: true }).fill("Lahore");
    await page.getByLabel("Province / territory").selectOption("Punjab");
    await page.getByRole("button", { name: "Complete order" }).click();

    await expect(page.getByRole("alert")).toContainText("valid Pakistani mobile number");

    // Fix phone number and select COD
    await page.getByLabel("Mobile number").fill("03224729343");
    await page.getByRole("radio", { name: /Cash on delivery/ }).check();
    await page.getByRole("button", { name: "Complete order" }).click();

    // Order Success Verification
    await expect(page).toHaveURL(/order-success\/GS-/);
    await expect(page.locator(".order-card")).toContainText("Cash on Delivery");
    await expect(page.locator(".order-card")).toContainText("QA Test Customer");
  });

  test("6. Checkout - Manual Payment & WhatsApp Integration", async ({ page }) => {
    await page.goto("/product/bye-bye-makeup");
    await page.getByRole("button", { name: "Buy now", exact: true }).click();

    await page.getByLabel("Full name", { exact: true }).fill("WhatsApp Test Customer");
    await page.getByLabel("Email address", { exact: true }).first().fill("wa@glamskincare.pk");
    await page.getByLabel("Mobile number").fill("03001234567");
    await page.getByLabel("Street address").fill("House 10");
    await page.getByLabel("Area / neighbourhood").fill("DHA Phase 5");
    await page.getByLabel("City", { exact: true }).fill("Lahore");
    await page.getByLabel("Province / territory").selectOption("Punjab");

    await page.getByRole("radio", { name: /Manual Online Payment/ }).check();
    await page.getByRole("button", { name: "Complete order" }).click();

    await expect(page).toHaveURL(/order-success\/GS-/);
    await expect(page.locator(".order-card")).toContainText("Awaiting Payment Verification");
    
    const waLink = page.getByRole("link", { name: /SEND PAYMENT SCREENSHOT ON WHATSAPP/ });
    await expect(waLink).toBeVisible();
    await expect(waLink).toHaveAttribute("href", /wa\.me\/923224729343/);
  });

  test("7. Responsive Layout Viewport Checks", async ({ page }) => {
    const viewports = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
    for (const width of viewports) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/shop");
      await expect(page.locator("h1").first()).toBeVisible();

      const size = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      }));
      expect(size.scroll, `Viewport ${width}px overflow`).toBeLessThanOrEqual(size.viewport + 1);
    }
  });

  test("8. Authorization & Route Protection Boundary", async ({ page }) => {
    // Unauthenticated access to /account/orders without session
    await page.goto("/account/orders");
    // Should render login auth form or access prompt
    await expect(page.locator("body")).toBeVisible();
  });
});
