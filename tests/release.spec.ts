import { test, expect, type Page } from "@playwright/test";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
const db = getFirestore(
  initializeApp({ projectId: "demo-glam-skincare" }, "release-tests"),
);
let browserErrors: string[] = [];
test.beforeEach(async ({ page }) => {
  browserErrors = [];
  page.on("pageerror", (error) => {
    browserErrors.push(error.message);
    console.log("Browser exception:", error.message);
  });
});
test.afterEach(() => {
  expect.soft(browserErrors).toEqual([]);
});
async function login(page: Page, admin = false) {
  await page.goto("/login");
  await page
    .locator("input[name=email]")
    .fill(admin ? "admin@glam.test" : "customer@glam.test");
  await page
    .locator("input[name=password]")
    .fill(admin ? "GlamAdmin123!" : "GlamCustomer123!");
  await page.getByRole("button", { name: "Sign In to Your Account" }).click();
  await expect(page).toHaveURL(admin ? /\/admin$/ : /\/account$/);
}
test("public routes render after direct navigation and refresh", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/",
    "/shop",
    "/product/bye-bye-makeup",
    "/how-it-works",
    "/about",
    "/faq",
    "/contact",
    "/login",
    "/register",
    "/cart",
    "/shipping",
    "/privacy",
    "/terms",
    "/missing",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.reload();
    await expect(page.locator("h1").first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("admin login, every tab direct entry and refresh, account redirect, logout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, true);
  for (const tab of [
    "",
    "/products",
    "/inventory",
    "/orders",
    "/payments",
    "/customers",
    "/reviews",
    "/analytics",
    "/settings",
    "/profile",
  ]) {
    await page.goto("/admin" + tab);
    await expect(page.locator(".admin-shell")).toBeVisible();
    await page.reload();
    await expect(page.locator(".admin-shell")).toBeVisible();
    await expect(page.locator(".admin-shell")).not.toContainText("Add to bag");
  }
  await page.goto("/account");
  await expect(page).toHaveURL(/\/admin/);
  await page
    .getByRole("button", { name: /Sign Out/i })
    .first()
    .click();
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/login/);
  expect(errors).toEqual([]);
});
test("customer cannot open admin; guest checkout requires login", async ({
  page,
}) => {
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/login/);
  await login(page);
  await page.goto("/admin/orders");
  await expect(page.locator(".admin-shell")).toHaveCount(0);
  await expect(page.locator("body")).toContainText(
    /access|permission|authorized|account/i,
  );
});
for (const method of ["cod", "manual_online_payment"]) {
  test(`${method}: real checkout persists, survives refresh and appears for customer and admin`, async ({
    page,
    browser,
  }) => {
    await db.doc("users/local-customer/limits/checkout").delete();
    await login(page);
    await page.goto("/product/bye-bye-makeup");
    await page.getByRole("button", { name: "Add to bag", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Soft White", exact: true }).click();
    await page.getByRole("button", { name: "Add to bag", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.goto("/checkout");
    await page.locator("[name=name]").fill("QA Customer");
    await page.locator("[name=phone]").fill("03001234567");
    await page.locator("[name=address]").fill("123 Test Road");
    await page.locator("[name=area]").fill("Test Area");
    await page.locator("[name=city]").fill("Lahore");
    await page.locator("[name=province]").selectOption("Punjab");
    await page.locator(`input[value="${method}"]`).check();
    await page.getByRole("button", { name: "Complete order" }).click();
    await expect(page).toHaveURL(/\/order-success\/GS-/);
    const id = page.url().split("/").at(-1)!;
    const snapshot = await db.doc(`orders/${id}`).get();
    expect(snapshot.exists).toBe(true);
    const order = snapshot.data()!;
    expect(order.customer.name).toBe("QA Customer");
    expect(order.paymentMethod).toBe(method);
    expect(order.total).toBe(order.subtotal + order.shipping);
    expect(order.items[0].quantity).toBe(1);
    expect(order.items).toHaveLength(2);
    await page.reload();
    await expect(page.getByRole("heading", { name: id })).toBeVisible();
    if (method === "cod")
      await expect(
        page.getByRole("link", { name: "SEND PAYMENT SCREENSHOT ON WHATSAPP" }),
      ).toHaveCount(0);
    else {
      const href = await page
        .getByRole("link", { name: "SEND PAYMENT SCREENSHOT ON WHATSAPP" })
        .getAttribute("href");
      expect(href).toContain("923224729343");
      expect(decodeURIComponent(href!)).toContain(id);
      expect(decodeURIComponent(href!)).toContain("QA Customer");
    }
    await page.goto("/account/orders");
    await expect(page.getByText(id, { exact: true })).toBeVisible();
    const admin = await browser.newPage();
    await login(admin, true);
    await admin.goto("/admin/orders");
    await expect(
      admin.getByText("Order #" + id, { exact: true }).first(),
    ).toBeVisible();
    await admin.reload();
    await expect(
      admin.getByText("Order #" + id, { exact: true }).first(),
    ).toBeVisible();
    const before = await Promise.all(
      order.items.map((i: { sku: string }) => db.doc(`skus/${i.sku}`).get()),
    );
    if (method === "cod") {
      const card = admin
        .locator("div")
        .filter({ has: admin.getByText("Order #" + id, { exact: true }) })
        .filter({
          has: admin.getByRole("button", {
            name: "Confirm Order",
            exact: true,
          }),
        })
        .last();
      await card.getByRole("button", { name: "Full Details" }).click();
      await expect(admin.getByRole("dialog")).toContainText("QA Customer");
      await admin.keyboard.press("Escape");
      await card
        .getByRole("button", { name: "Confirm Order", exact: true })
        .click();
    } else {
      await admin.goto("/admin/payments");
      await admin
        .getByRole("row")
        .filter({ hasText: id })
        .getByRole("button", { name: "VERIFY", exact: true })
        .click();
      await admin.getByRole("button", { name: "Yes, Verify Payment" }).click();
    }
    await expect
      .poll(
        async () => (await db.doc(`orders/${id}`).get()).data()?.orderStatus,
      )
      .toBe("confirmed");
    for (let i = 0; i < order.items.length; i++) {
      expect(
        (await db.doc(`skus/${order.items[i].sku}`).get()).data()?.stock,
      ).toBe(before[i].data()!.stock - 1);
      const product = (
        await db.doc(`products/${order.items[i].productId}`).get()
      ).data()!;
      expect(
        product.variants.find(
          (v: { sku: string }) => v.sku === order.items[i].sku,
        ).stock,
      ).toBe(before[i].data()!.stock - 1);
    }
    if (method !== "cod") {
      const verified = (await db.doc(`orders/${id}`).get()).data()!;
      expect(verified.verifiedBy).toBe("local-admin");
      expect(verified.verifiedAt).toBeTruthy();
    }
    await page.goto(`/account/orders/${id}`);
    await expect(
      page.getByText("Confirmed", { exact: true }).first(),
    ).toBeVisible();
    if (method === "cod") {
      const card = admin
        .locator("div")
        .filter({ has: admin.getByText("Order #" + id, { exact: true }) })
        .filter({ has: admin.getByRole("button", { name: "Full Details" }) })
        .last();
      for (const [button, status] of [
        ["Mark Processing", "processing"],
        ["Mark Shipped", "shipped"],
        ["Mark Delivered", "delivered"],
      ]) {
        await card.getByRole("button", { name: button, exact: true }).click();
        await expect
          .poll(
            async () =>
              (await db.doc(`orders/${id}`).get()).data()?.orderStatus,
          )
          .toBe(status);
      }
      await page.reload();
      await expect(
        page.getByText("Delivered", { exact: true }).first(),
      ).toBeVisible();
    }
    await admin.close();
    console.log("Persisted test order", id, method, order.total);
  });
}
test("responsive public pages have no horizontal overflow", async ({
  page,
}) => {
  test.setTimeout(180000);
  for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/shop",
      "/product/bye-bye-makeup",
      "/login",
      "/cart",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${route} at ${width}px`,
      ).toBe(true);
    }
  }
});
test("product CRUD preserves variants, private costs, prices, and archive state", async ({
  page,
  browser,
}) => {
  test.setTimeout(180000);
  const name = `QA Essential ${Date.now()}`;
  await login(page, true);
  await page.goto("/admin/products");
  await page.getByRole("button", { name: "Create Product" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel("Product Name", { exact: true }).fill(name);
  await modal.getByLabel("Subtitle", { exact: true }).fill("QA only");
  await modal.getByLabel("Selling Price (PKR)", { exact: true }).fill("900");
  await modal.getByLabel("Private COGS (PKR)", { exact: true }).fill("300");
  await modal
    .getByLabel("Description", { exact: true })
    .fill("Temporary emulator regression product.");
  await modal.getByRole("button", { name: "Save Product" }).click();
  await expect(modal).toHaveCount(0);
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row).toBeVisible();
  const result = await db
    .collection("products")
    .where("name", "==", name)
    .get();
  const ref = result.docs[0].ref;
  const original = result.docs[0].data();
  expect(original.variants).toHaveLength(2);
  expect(original.costPrice).toBeUndefined();
  expect((await db.doc(`productCosts/${ref.id}`).get()).data()?.costPrice).toBe(
    300,
  );
  await row.getByTitle("Edit product", { exact: true }).click();
  await modal.getByLabel("Blush Pink stock", { exact: true }).fill("5");
  await modal.getByLabel("Soft White stock", { exact: true }).fill("0");
  await modal.getByLabel("Selling Price (PKR)", { exact: true }).fill("975");
  await modal.getByRole("button", { name: "Save Product" }).click();
  await expect(modal).toHaveCount(0);
  await page.reload();
  await expect(row).toBeVisible();
  const changed = (await ref.get()).data()!;
  expect(changed.variants.map((v: { stock: number }) => v.stock)).toEqual([
    5, 0,
  ]);
  expect(changed.price).toBe(975);
  const store = await browser.newPage();
  await store.goto(`/product/${changed.slug}`);
  await expect(store.locator("h1")).toContainText(name);
  await expect(store.locator(".product-price").first()).toContainText("975");
  await store.getByRole("button", { name: "Soft White", exact: true }).click();
  await expect(
    store.getByRole("button", { name: "Add to bag", exact: true }).first(),
  ).toBeDisabled();
  for (const [pink, white] of [
    [5, 2],
    [5, 0],
    [0, 5],
    [0, 0],
    [5, 0],
  ]) {
    await row.getByTitle("Edit product", { exact: true }).click();
    await modal
      .getByLabel("Blush Pink stock", { exact: true })
      .fill(String(pink));
    await modal
      .getByLabel("Soft White stock", { exact: true })
      .fill(String(white));
    await modal.getByRole("button", { name: "Save Product" }).click();
    await expect(modal).toHaveCount(0);
    for (const [colour, stock] of [
      ["Blush Pink", pink],
      ["Soft White", white],
    ] as const) {
      await store.getByRole("button", { name: colour, exact: true }).click();
      const purchase = store
        .getByRole("button", { name: "Add to bag", exact: true })
        .first();
      if (stock === 0) await expect(purchase).toBeDisabled();
      else await expect(purchase).toBeEnabled();
    }
  }
  await store.getByRole("button", { name: "Blush Pink", exact: true }).click();
  await store
    .getByRole("button", { name: "Add to bag", exact: true })
    .first()
    .click();
  await store.keyboard.press("Escape");
  await store.goto("/cart");
  await expect(store.locator(".cart-line")).toContainText("975");
  await row.getByTitle("Edit product", { exact: true }).click();
  await modal.getByLabel("Selling Price (PKR)", { exact: true }).fill("990");
  await modal.getByRole("button", { name: "Save Product" }).click();
  await expect(modal).toHaveCount(0);
  await expect(store.locator(".cart-line")).toContainText("990");
  await login(store);
  await store.goto("/checkout");
  await expect(store.locator(".checkout-line")).toContainText("990");
  await store.locator("[name=name]").fill("QA Price Customer");
  await store.locator("[name=phone]").fill("03001234567");
  await store.locator("[name=address]").fill("Test Road");
  await store.locator("[name=area]").fill("Test Area");
  await store.locator("[name=city]").fill("Lahore");
  await store.locator("[name=province]").selectOption("Punjab");
  await db.doc("users/local-customer/limits/checkout").delete();
  await store.getByRole("button", { name: "Complete order" }).click();
  await expect(store).toHaveURL(/\/order-success\/GS-/);
  const priceOrderId = store.url().split("/").at(-1)!;
  expect(
    (await db.doc(`orders/${priceOrderId}`).get()).data()?.items[0].unitPrice,
  ).toBe(990);
  await store.goto(`/product/${changed.slug}`);
  await store
    .getByRole("button", { name: "Add to bag", exact: true })
    .first()
    .click();
  await store.keyboard.press("Escape");
  await row.getByRole("button", { name: /deactivate/i }).click();
  await expect.poll(async () => (await ref.get()).data()?.active).toBe(false);
  for (const v of changed.variants)
    expect((await db.doc(`skus/${v.sku}`).get()).data()?.active).toBe(false);
  await store.goto("/cart");
  await expect(store.locator(".cart-line")).toHaveCount(0);
  await store.goto(`/product/${changed.slug}`);
  await expect(
    store.getByRole("heading", { name: /This essential/ }),
  ).toBeVisible();
  await row.getByRole("button", { name: /activate/i }).click();
  await expect.poll(async () => (await ref.get()).data()?.active).toBe(true);
  await store.reload();
  await expect(store.locator("h1")).toContainText(name);
  await store.close();
  const batch = db.batch();
  batch.delete(ref);
  batch.delete(db.doc(`productCosts/${ref.id}`));
  batch.delete(db.doc(`productSlugs/${changed.slug}`));
  batch.delete(db.doc(`orders/${priceOrderId}`));
  changed.variants.forEach((v: { sku: string }) =>
    batch.delete(db.doc(`skus/${v.sku}`)),
  );
  await batch.commit();
});
test("mobile menu, search, gallery, cart controls and persistence", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await page
    .getByRole("button", { name: "Search products", exact: true })
    .click();
  await page.getByRole("dialog").getByRole("textbox").fill("Bye-Bye");
  await page.getByRole("dialog").getByRole("link").first().click();
  await expect(page).toHaveURL(/\/product\/bye-bye-makeup/);
  await page.getByRole("button", { name: "Zoom product image" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Add to bag", exact: true })
    .first()
    .click();
  await page.keyboard.press("Escape");
  await page.goto("/cart");
  await expect(page.locator(".cart-line")).toHaveCount(1);
  await page
    .getByRole("button", { name: /Increase/ })
    .first()
    .click();
  await expect(page.locator(".cart-line .quantity")).toContainText("2");
  await page.reload();
  await expect(page.locator(".cart-line .quantity")).toContainText("2");
  await page
    .getByRole("button", { name: /Decrease/ })
    .first()
    .click();
  await expect(page.locator(".cart-line .quantity")).toContainText("1");
  await page
    .getByRole("button", { name: /Remove/ })
    .first()
    .click();
  await expect(page.locator(".cart-line")).toHaveCount(0);
});
test("admin profile saves and small-screen navigation stays usable", async ({
  page,
}) => {
  await login(page, true);
  await page.goto("/admin/profile");
  const inputs = page.locator(".admin-content form input");
  await inputs.first().fill("Glam QA Admin");
  await page.getByLabel("Admin Phone Number").fill("03001234567");
  await page.getByRole("button", { name: /Save.*Profile/i }).click();
  await expect
    .poll(
      async () => (await db.doc("users/local-admin").get()).data()?.displayName,
    )
    .toBe("Glam QA Admin");
  await page.reload();
  await expect(inputs.first()).toHaveValue("Glam QA Admin");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.getByRole("button", { name: "Admin Profile", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `admin ${width}`,
    ).toBe(true);
  }
  await page.screenshot({ path: ".audit/admin-profile.png", fullPage: true });
});
test("registration validation, session persistence, wrong password and password recovery", async ({
  page,
}) => {
  const email = `qa-${Date.now()}@glam.test`;
  await page.goto("/register");
  const submit = page
    .locator("form")
    .getByRole("button", { name: "Create Account / Sign Up" });
  await submit.click();
  await expect(page).toHaveURL(/\/register/);
  await page.locator("[name=name]").fill("QA Registration");
  await page.locator("[name=email]").fill("invalid");
  await page.locator("[name=password]").fill("short");
  await submit.click();
  await expect(page).toHaveURL(/\/register/);
  await page.locator("[name=email]").fill(email);
  await page.locator("[name=password]").fill("GlamTest123!");
  await submit.click();
  await expect(page).toHaveURL(/\/account/);
  await expect
    .poll(
      async () =>
        (await db.collection("users").where("email", "==", email).get()).size,
    )
    .toBe(1);
  await page.reload();
  await expect(page.locator("body")).toContainText("QA Registration");
  await page
    .getByRole("button", { name: /sign out/i })
    .first()
    .click();
  await page.goto("/login");
  await page.locator("[name=email]").fill(email);
  await page.locator("[name=password]").fill("WrongPassword123!");
  await page.getByRole("button", { name: "Sign In to Your Account" }).click();
  await expect(page.locator(".form-error")).toBeVisible();
  await page.getByText("Forgot password?", { exact: true }).click();
  await page.locator("[name=email]").fill(email);
  await page.getByRole("button", { name: "Send Recovery Email" }).click();
  await expect(page.locator("body")).toContainText(
    "recovery link has been sent",
  );
});
test("manual rejection and review moderation persist and update customer views", async ({
  page,
  browser,
}) => {
  const source = (
    await db
      .collection("orders")
      .where("paymentMethod", "==", "manual_online_payment")
      .get()
  ).docs[0].data();
  const id = `GS-${Date.now()}`;
  await db.doc(`orders/${id}`).set({
    ...source,
    orderNumber: id,
    orderStatus: "payment_verification",
    paymentStatus: "awaiting_verification",
    inventoryReserved: false,
    verifiedAt: null,
    verifiedBy: "",
    history: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const reviewId = `qa-review-${Date.now()}`;
  await db.doc(`reviews/${reviewId}`).set({
    productId: "bye-bye-makeup",
    orderId: id,
    userId: "local-customer",
    author: "QA Reviewer",
    rating: 4,
    body: reviewId,
    status: "pending",
    verifiedPurchase: true,
    createdAt: FieldValue.serverTimestamp(),
  });
  await login(page, true);
  await page.goto("/admin/payments");
  await page
    .getByRole("row")
    .filter({ hasText: id })
    .getByRole("button", { name: "REJECT", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm Rejection", exact: true })
    .click();
  await expect
    .poll(
      async () => (await db.doc(`orders/${id}`).get()).data()?.paymentStatus,
    )
    .toBe("rejected");
  const customer = await browser.newPage();
  await login(customer);
  await customer.goto(`/account/orders/${id}`);
  await expect(customer.getByRole("alert")).toContainText(
    "Payment not received",
  );
  await page.goto("/admin/reviews");
  const card = page
    .locator("div")
    .filter({ has: page.getByText(reviewId, { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Approve", exact: true }) })
    .last();
  await card.getByRole("button", { name: "Approve", exact: true }).click();
  await expect
    .poll(
      async () => (await db.doc(`reviews/${reviewId}`).get()).data()?.status,
    )
    .toBe("approved");
  await customer.goto("/product/bye-bye-makeup");
  await expect(customer.getByText(reviewId, { exact: true })).toBeVisible();
  const approved = page
    .locator("div")
    .filter({ has: page.getByText(reviewId, { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Hide", exact: true }) })
    .last();
  await approved.getByRole("button", { name: "Hide", exact: true }).click();
  await expect(customer.getByText(reviewId, { exact: true })).toHaveCount(0);
  await customer.close();
  await db.doc(`reviews/${reviewId}`).delete();
  await db.doc(`orders/${id}`).delete();
});
test("settings shipping and manual-payment switch persist and reach checkout", async ({
  page,
  browser,
}) => {
  const original = (await db.doc("settings/store").get()).data()!;
  await login(page, true);
  await page.goto("/admin/settings");
  await page.locator("[name=shippingFee]").fill("0");
  await page.locator("[name=freeAbove]").fill("5000");
  await page.locator("[name=estimatedDays]").fill("QA 4 working days");
  await page.locator("[name=bankEnabled]").uncheck();
  await page
    .getByRole("button", { name: "Save Store Settings", exact: true })
    .click();
  await expect
    .poll(
      async () => (await db.doc("settings/store").get()).data()?.shipping.fee,
    )
    .toBe(0);
  await page.reload();
  await expect(page.locator("[name=shippingFee]")).toHaveValue("0");
  await expect(page.locator("[name=bankEnabled]")).not.toBeChecked();
  const customer = await browser.newPage();
  await login(customer);
  await customer.goto("/product/bye-bye-makeup");
  await customer.getByRole("button", { name: "Buy now", exact: true }).click();
  await expect(
    customer.locator("[value=manual_online_payment]"),
  ).toBeDisabled();
  await expect(customer.locator(".order-summary")).toContainText(
    "QA 4 working days",
  );
  await expect(customer.locator(".order-summary")).toContainText(
    "Complimentary",
  );
  await customer.close();
  await db.doc("settings/store").set(original);
});

test("public filters, FAQ, contact draft and guest tracking give honest results", async ({
  page,
}) => {
  await page.goto("/shop");
  await page
    .getByRole("textbox", { name: "Search products", exact: true })
    .fill("no-such-essential");
  await expect(page.locator(".product-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".product-card").first()).toBeVisible();
  await page
    .getByRole("combobox", { name: "Sort products" })
    .selectOption("price-desc");
  await page
    .getByRole("combobox", { name: "Colour", exact: true })
    .selectOption("ivory");
  await page.getByRole("checkbox", { name: "In stock only" }).check();
  await expect(page).toHaveURL(/stock=true/);
  await page.goto("/faq");
  const disclosure = page.locator(".accordion details").first();
  await disclosure.locator("summary").click();
  await expect(disclosure).toHaveAttribute("open", "");
  await disclosure.locator("summary").click();
  await expect(disclosure).not.toHaveAttribute("open", "");
  await page.goto("/contact");
  const form = page.locator(".contact-form");
  await form.locator("[name=name]").fill("QA Contact");
  await form.locator("[name=email]").fill("qa@glam.test");
  await form.locator("[name=message]").fill("QA draft only; not sent.");
  await form.getByRole("button", { name: "Prepare WhatsApp message" }).click();
  await expect(form).toContainText("It has not been sent yet.");
  expect(
    decodeURIComponent(
      (await form
        .getByRole("link", { name: "Open WhatsApp to send" })
        .getAttribute("href"))!,
    ),
  ).toContain("QA draft only");
  await page.getByRole("button", { name: "Track your order" }).click();
  await page
    .getByPlaceholder(/GS-|order/i)
    .first()
    .fill("GS-UNKNOWN");
  await page.getByRole("button", { name: "Track", exact: true }).click();
  await expect(
    page.getByText(/Please sign in to the account that placed this order/),
  ).toBeVisible();
});
