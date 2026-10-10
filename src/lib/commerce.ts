import { products as seedProducts } from "../data/catalog";
import { business } from "../config/business";
import type { CartLine, Discount, Order, Product } from "../types";
export function sanitizeOrders(input: unknown): Order[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((order): order is Order => {
      if (!order || typeof order !== "object") return false;
      return (
        typeof order.id === "string" &&
        /^PREVIEW-[A-Z0-9]{8}$/.test(order.id) &&
        typeof order.createdAt === "string" &&
        Number.isFinite(Date.parse(order.createdAt)) &&
        ["subtotal", "shipping", "discount", "total"].every(
          (key) =>
            typeof order[key] === "number" &&
            Number.isFinite(order[key]) &&
            order[key] >= 0,
        ) &&
        (order.payment === "cod" || order.payment === "bank") &&
        (order.status === "Preview only" ||
          order.status === "Payment Verification Pending") &&
        (order.receiptName === undefined ||
          typeof order.receiptName === "string") &&
        Array.isArray(order.items) &&
        order.items.length > 0 &&
        order.items.every(
          (line: CartLine) =>
            line &&
            typeof line.productId === "string" &&
            typeof line.variantId === "string" &&
            Number.isInteger(line.quantity) &&
            line.quantity > 0,
        )
      );
    })
    .slice(0, 20);
}
export function sanitizeCart(
  input: unknown,
  catalog: Product[] = seedProducts,
): CartLine[] {
  if (!Array.isArray(input)) return [];
  const result: CartLine[] = [];
  for (const line of input) {
    if (!line || typeof line !== "object") continue;
    const product = catalog.find((p) => p.id === line.productId);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (
      !product ||
      !variant ||
      !Number.isFinite(line.quantity) ||
      line.quantity <= 0
    )
      continue;
    const existing = result.find(
      (l) => l.productId === product.id && l.variantId === variant.id,
    );
    const quantity = Math.min(
      Math.min(10, variant.active === false ? 0 : variant.stock),
      Math.floor(line.quantity) + (existing?.quantity ?? 0),
    );
    if (quantity < 1) continue;
    if (existing) existing.quantity = quantity;
    else
      result.push({ productId: product.id, variantId: variant.id, quantity });
  }
  return result;
}
export function totals(
  items: CartLine[],
  discount?: Discount,
  catalog: Product[] = seedProducts,
  shippingConfig = business.shipping,
) {
  const subtotal = sanitizeCart(items, catalog).reduce(
    (sum, line) =>
      sum +
      (catalog
        .find((p) => p.id === line.productId)!
        .variants.find((v) => v.id === line.variantId)?.priceOverride ??
        catalog.find((p) => p.id === line.productId)!.price) *
        line.quantity,
    0,
  );
  const saving =
    discount?.enabled &&
    Number.isFinite(discount.value) &&
    discount.value >= 0 &&
    (discount.kind !== "percentage" || discount.value <= 100) &&
    subtotal >= discount.minimum
      ? Math.min(
          subtotal,
          discount.kind === "fixed"
            ? discount.value
            : (subtotal * discount.value) / 100,
        )
      : 0;
  const shipping =
    subtotal === 0 || subtotal - saving >= shippingConfig.freeAbove
      ? 0
      : shippingConfig.fee;
  return {
    subtotal,
    shipping,
    discount: saving,
    total: subtotal - saving + shipping,
  };
}
export function readStorage<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
