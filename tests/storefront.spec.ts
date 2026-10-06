import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
  "/missing",
];

test("all routes render with no broken local images or JS errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("main h1, main h2").first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      "Something didn’t load as expected",
    );
    const broken = await page
      .locator("img")
      .evaluateAll((images) =>
        images.filter((i) => i.complete && !i.naturalWidth).map((i) => i.src),
      );
    expect(broken, route).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test("layouts fit every requested screen size", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "glam.cart.v1",
      JSON.stringify([
        { productId: "bye-bye-makeup", variantId: "blush", quantity: 1 },
      ]),
    ),
  );
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/shop",
      "/product/bye-bye-makeup",
      "/contact",
      "/login",
      "/cart",
      "/checkout",
    ]) {
      await page.goto(route);
      await expect(page.locator("main h1, main h2").first()).toBeVisible();
      const size = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        viewport: innerWidth,
      }));
      expect(size.scroll, `${route} at ${width}`).toBeLessThanOrEqual(
        size.viewport + 1,
      );
    }
  }
});

test("search, variant, persistent cart, quantity and removal", async ({
  page,
}) => {
  await page.goto("/shop?q=not-a-product");
  await expect(page.getByText("A fresh start?")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.goto("/product/bye-bye-makeup");
  await page.getByRole("button", { name: "Soft White", exact: true }).click();
  await expect(page).toHaveURL(/colour=ivory/);
  await page
    .getByRole("button", { name: "Add to bag", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Soft White");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await page.goto("/cart");
  await expect(page.locator(".cart-line")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Increase Soft White quantity" })
    .click();
  await expect(page.locator(".cart-line .quantity")).toContainText("2");
  await page.getByRole("button", { name: "Remove Soft White" }).click();
  await expect(page.getByText("Your ritual starts here.")).toBeVisible();
});

test("checkout manual online payment workflow generates WhatsApp verification link", async ({
  page,
}) => {
  await page.goto("/product/bye-bye-makeup");
  await page.getByRole("button", { name: "Buy now", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Test Customer");
  await page
    .getByLabel("Email address", { exact: true })
    .first()
    .fill("test@example.com");
  await page.getByLabel("Mobile number").fill("03001234567");
  await page.getByLabel("Street address").fill("12 Test Street");
  await page.getByLabel("Area / neighbourhood").fill("Test Area");
  await page.getByLabel("City", { exact: true }).fill("Lahore");
  await page.getByLabel("Province / territory").selectOption("Punjab");
  await page.getByRole("radio", { name: /Manual Online Payment/ }).check();
  await expect(
    page.getByText("Select Payment Method", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Complete order" }).click();
  await expect(page).toHaveURL(/order-success\/GS-/);
  await expect(page.locator(".order-card")).toContainText(
    "Awaiting Payment Verification",
  );
  await expect(
    page.getByRole("link", { name: /SEND PAYMENT SCREENSHOT ON WHATSAPP/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /SEND PAYMENT SCREENSHOT ON WHATSAPP/ }),
  ).toHaveAttribute("href", /wa\.me\/923224729343/);

  await page.goto("/cart");
  await expect(page.getByText("Your ritual starts here.")).toBeVisible();
});

test("mobile navigation, dialog keyboard handling, zoom and accessibility", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await page.goto("/product/bye-bye-makeup");
  await page.getByRole("button", { name: "Zoom product image" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Next image" }).click();
  await page.keyboard.press("Escape");
  const violations: unknown[] = [];
  for (const route of ["/", "/product/bye-bye-makeup", "/contact", "/login"]) {
    await page.goto(route);
    await expect(page.locator("main h1").first()).toBeVisible();
    await page.waitForTimeout(500);
    const report = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    violations.push(
      ...report.violations.map((v) => ({
        route,
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    );
  }
  expect(violations).toEqual([]);
});

test("COD validates contact details and places order successfully", async ({
  page,
}) => {
  await page.goto("/product/bye-bye-makeup");
  await page.getByRole("button", { name: "Buy now", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Preview Customer");
  await page
    .getByLabel("Email address", { exact: true })
    .first()
    .fill("preview@example.com");
  await page.getByLabel("Mobile number").fill("123");
  await page.getByLabel("Street address").fill("1 Preview Street");
  await page.getByLabel("Area / neighbourhood").fill("Preview Area");
  await page.getByLabel("City", { exact: true }).fill("Karachi");
  await page.getByLabel("Province / territory").selectOption("Sindh");
  await page.getByRole("button", { name: "Complete order" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "valid Pakistani mobile number",
  );
  await page.getByLabel("Mobile number").fill("03001234567");
  await page.getByRole("radio", { name: /Cash on delivery/ }).check();
  await page.getByRole("button", { name: "Complete order" }).click();
  await expect(page).toHaveURL(/order-success\/GS-/);
  await expect(page.locator(".order-card")).toContainText("Cash on Delivery");
});
