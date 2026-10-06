import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
await mkdir(".audit", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
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
await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
await settle();
await page.screenshot({ path: ".audit/home-desktop.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: ".audit/home-mobile.png", fullPage: true });
await page.goto("http://127.0.0.1:5173/product/bye-bye-makeup", {
  waitUntil: "networkidle",
});
await settle();
await page.screenshot({ path: ".audit/product-mobile.png", fullPage: true });
await page.getByRole("button", { name: "Buy now", exact: true }).click();
await page.screenshot({ path: ".audit/checkout-mobile.png", fullPage: true });
await browser.close();
console.log(
  "Saved desktop, mobile, product and checkout screenshots to .audit.",
);
