import { describe, expect, it } from "vitest";
import { sanitizeCart, sanitizeOrders, totals } from "./commerce";
import { whatsappUrl } from "../config/business";
describe("guest cart integrity", () => {
  it("rejects corrupt order previews without breaking account pages", () => {
    expect(
      sanitizeOrders([
        null,
        {},
        { id: "PREVIEW-12345678", items: [null], total: 100 },
        { id: "../../invalid", createdAt: "invalid" },
      ]),
    ).toEqual([]);
    expect(sanitizeOrders("broken")).toEqual([]);
  });
  it("rejects malformed and removed catalog items", () => {
    expect(
      sanitizeCart([
        null,
        {},
        { productId: "missing", variantId: "blush", quantity: 1 },
        { productId: "bye-bye-makeup", variantId: "invalid", quantity: 1 },
        { productId: "bye-bye-makeup", variantId: "blush", quantity: -1 },
      ]),
    ).toEqual([]);
    expect(sanitizeCart({})).toEqual([]);
  });
  it("merges matching variants, caps stock and floors fractions", () => {
    expect(
      sanitizeCart([
        { productId: "bye-bye-makeup", variantId: "blush", quantity: 19 },
        { productId: "bye-bye-makeup", variantId: "blush", quantity: 8 },
        { productId: "bye-bye-makeup", variantId: "ivory", quantity: 1.9 },
      ]),
    ).toEqual([
      { productId: "bye-bye-makeup", variantId: "blush", quantity: 20 },
      { productId: "bye-bye-makeup", variantId: "ivory", quantity: 1 },
    ]);
  });
  it("charges shipping only on a nonempty cart below threshold", () => {
    expect(totals([]).total).toBe(0);
    expect(
      totals([
        { productId: "bye-bye-makeup", variantId: "blush", quantity: 1 },
      ]),
    ).toEqual({ subtotal: 850, shipping: 200, discount: 0, total: 1050 });
    expect(
      totals([{ productId: "bye-bye-makeup", variantId: "blush", quantity: 3 }])
        .shipping,
    ).toBe(0);
  });
  it("caps a valid discount and ignores an inactive one", () => {
    const cart = [
      { productId: "bye-bye-makeup", variantId: "blush", quantity: 1 },
    ];
    expect(
      totals(cart, {
        code: "TEST",
        kind: "fixed",
        value: 1000,
        minimum: 0,
        enabled: true,
      }).discount,
    ).toBe(850);
    expect(
      totals(cart, {
        code: "TEST",
        kind: "percentage",
        value: 10,
        minimum: 0,
        enabled: false,
      }).discount,
    ).toBe(0);
  });
  it("encodes contextual WhatsApp messages", () => {
    const message = "Hi Glam! Question about order #PREVIEW-123 & payment.";
    const url = new URL(whatsappUrl(message));
    expect(url.hostname).toBe("wa.me");
    expect(url.searchParams.get("text")).toBe(message);
  });
});
