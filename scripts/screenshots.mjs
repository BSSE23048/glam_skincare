import { chromium, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
await mkdir(".audit/portfolio", { recursive: true });
const preview = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--outDir", ".audit/qa-dist", "--host", "127.0.0.1", "--port", "5176", "--strictPort"], { stdio: "inherit" });
let ready = false;
for (let attempt = 0; attempt < 100; attempt++) {
  try { ready = (await fetch("http://127.0.0.1:5176")).ok; } catch { /* Preview is starting. */ }
  if (ready) break;
  await new Promise(resolve => setTimeout(resolve, 200));
}
if (!ready) { preview.kill(); throw new Error("QA preview did not start"); }
process.on("exit", () => preview.kill());
let browser;
try {
browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
async function settle() {
  await page.evaluate(async () => {
    for (const image of document.images) {
      image.loading = "eager";
    }
    await Promise.all(
      Array.from(document.images).map((image) =>
        image.decode().catch(() => {}),
      ),
    );
  });
  await page.waitForTimeout(700);
}
await page.goto("http://127.0.0.1:5176", { waitUntil: "domcontentloaded" });
await expect(page.locator(".product-card").first()).toBeVisible();
await settle();
await page.screenshot({ path: ".audit/portfolio/home-desktop.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: ".audit/portfolio/home-mobile.png", fullPage: true });
await page.goto("http://127.0.0.1:5176/product/bye-bye-makeup", {
  waitUntil: "domcontentloaded",
});
await expect(page.getByRole("button", { name: "Add to bag", exact: true }).first()).toBeEnabled();
await settle();
await page.screenshot({ path: ".audit/portfolio/product-mobile.png", fullPage: true });
await page.goto("http://127.0.0.1:5176/login");
await page.locator("[name=email]").fill("customer@glam.test");
await page.locator("[name=password]").fill("GlamCustomer123!");
await page.getByRole("button", { name: "Sign In to Your Account", exact: true }).click();
await expect(page).not.toHaveURL(/\/login$/);
await page.goto("http://127.0.0.1:5176/product/bye-bye-makeup");
await page.getByRole("button", { name: "Buy now", exact: true }).click();
await expect(page.locator(".order-summary")).toBeVisible();
await settle();
await page.screenshot({ path: ".audit/portfolio/checkout-mobile.png", fullPage: true });
} finally {
  await browser?.close();
  preview.kill();
}
console.log(
  "Saved synthetic demo screenshots to .audit/portfolio.",
);

