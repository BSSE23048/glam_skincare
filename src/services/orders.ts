import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  orderBy,
} from "firebase/firestore";
import type { CartLine, Customer } from "../types";
import type {
  OrderItem,
  OrderStatus,
  PaymentMethod,
  ShopOrder,
  SkuRecord,
  StoreSettings,
} from "../domain/models";
import { requireFirebase } from "./firebase";
import { canTransition } from "../domain/orders";

export function newOrderId() {
  return `GS-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}

export async function createOrder(input: {
  id: string;
  cart: CartLine[];
  customer: Customer;
  paymentMethod: PaymentMethod;
  skus: Record<string, string>;
}) {
  const { auth, db } = requireFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in before placing your order.");
  if (!input.cart.length || input.cart.length > 5)
    throw new Error(
      "Your bag can contain up to 5 different variants per order.",
    );

  const settingsSnap = await getDoc(doc(db, "settings", "store"));
  if (!settingsSnap.exists())
    throw new Error("Store settings are unavailable. Please try again later.");
  const settings = settingsSnap.data() as StoreSettings;

  const isManual = input.paymentMethod === "manual_online_payment";
  if (isManual && settings.bank && !settings.bank.enabled) {
    throw new Error("Manual online payment is currently unavailable.");
  }

  await runTransaction(db, async (transaction) => {
    const orderRef = doc(db, "orders", input.id);
    const existing = await transaction.get(orderRef);
    if (existing.exists()) {
      if (existing.data().userId !== user.uid)
        throw new Error("Invalid order reference.");
      return;
    }

    const config = await transaction.get(doc(db, "settings", "store"));
    if (!config.exists()) throw new Error("Store settings are unavailable.");
    const current = config.data() as StoreSettings;
    if (isManual && !current.bank.enabled)
      throw new Error("Manual payment is unavailable.");
    const skuIds = input.cart.map(
      (line) => input.skus[`${line.productId}:${line.variantId}`],
    );
    if (skuIds.some((sku) => !sku) || new Set(skuIds).size !== skuIds.length) {
      throw new Error("Please refresh your bag before ordering.");
    }

    const snapshots = await Promise.all(
      skuIds.map((sku) => transaction.get(doc(db, "skus", sku))),
    );
    const items: OrderItem[] = snapshots.map((snap, index) => {
      const sku = snap.data() as SkuRecord;
      const line = input.cart[index];
      if (
        !snap.exists() ||
        !sku.active ||
        !Number.isInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > 10 ||
        sku.stock < line.quantity
      ) {
        throw new Error(
          "An item is no longer available in that quantity. Please update your bag.",
        );
      }
      return {
        sku: snap.id,
        productId: sku.productId,
        variantId: sku.variantId,
        name: sku.name,
        variantName: sku.variantName,
        image: sku.image,
        unitPrice: sku.price,
        quantity: line.quantity,
        lineTotal: sku.price * line.quantity,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const shipping =
      subtotal >= current.shipping.freeAbove ? 0 : current.shipping.fee;

    const initialOrderStatus: OrderStatus = isManual
      ? "payment_verification"
      : "pending";
    const initialPaymentStatus = isManual
      ? "awaiting_verification"
      : "cod_pending";

    const data = {
      orderNumber: input.id,
      userId: user.uid,
      customer: {
        ...input.customer,
        email: user.email || input.customer.email,
      },
      items,
      subtotal,
      shipping,
      total: subtotal + shipping,
      paymentMethod: input.paymentMethod,
      paymentStatus: initialPaymentStatus,
      orderStatus: initialOrderStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      inventoryReserved: false,
      verifiedAt: null,
      verifiedBy: "",
      rejectionReason: "",
      trackingNumber: "",
      history: [],
    };

    transaction.set(orderRef, data);
    transaction.set(doc(db, "users", user.uid, "limits", "checkout"), {
      lastOrderAt: serverTimestamp(),
      orderId: input.id,
    });
  });

  return input.id;
}

export const watchOrders = (
  uid: string | null,
  receive: (orders: ShopOrder[]) => void,
  fail: (error: Error) => void,
) => {
  const { db } = requireFirebase();
  const source = uid
    ? query(
        collection(db, "orders"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc"),
      )
    : query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(
    source,
    (snap) =>
      receive(
        snap.docs
          .map((d) => ({ ...d.data(), id: d.id }) as ShopOrder)
          .sort(
            (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
          ),
      ),
    fail,
  );
};

export const watchOrder = (
  id: string,
  receive: (order: ShopOrder | null) => void,
  fail: (error: Error) => void,
) =>
  onSnapshot(
    doc(requireFirebase().db, "orders", id),
    (snap) =>
      receive(
        snap.exists() ? ({ ...snap.data(), id: snap.id } as ShopOrder) : null,
      ),
    fail,
  );

export async function updateOrder(
  id: string,
  action: OrderStatus | "verify" | "reject",
  reasonOrMessage = "",
  trackingNumber = "",
) {
  const { db, auth } = requireFirebase();
  if (!auth.currentUser) throw new Error("Sign in again.");
  const actor = auth.currentUser.uid;

  await runTransaction(db, async (transaction) => {
    const ref = doc(db, "orders", id);
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error("Order not found.");
    const order = snap.data() as ShopOrder;

    let nextStatus: OrderStatus;
    let nextPaymentStatus = order.paymentStatus;
    let rejectionReason = order.rejectionReason || "";

    if (
      (action === "verify" || action === "reject") &&
      (order.paymentMethod !== "manual_online_payment" ||
        !["payment_verification", "payment_rejected"].includes(
          order.orderStatus,
        ))
    )
      throw new Error("Only an awaiting manual payment can be reviewed.");
    if (action === "reject" && !reasonOrMessage.trim())
      throw new Error("A rejection reason is required.");
    if (
      action === "confirmed" &&
      order.paymentMethod === "manual_online_payment" &&
      order.paymentStatus !== "verified"
    )
      throw new Error("Verify manual payment before confirmation.");
    if (action === "verify") {
      nextStatus = "confirmed";
      nextPaymentStatus = "verified";
    } else if (action === "reject") {
      nextStatus = "payment_rejected";
      nextPaymentStatus = "rejected";
      rejectionReason = reasonOrMessage.trim();
    } else {
      nextStatus = action;
      if (!canTransition(order.orderStatus, nextStatus)) {
        throw new Error(
          `Cannot transition order status from ${order.orderStatus} to ${nextStatus}.`,
        );
      }
    }

    const reserve = nextStatus === "confirmed" && !order.inventoryReserved;
    const release = nextStatus === "cancelled" && order.inventoryReserved;

    const records =
      reserve || release
        ? await Promise.all(
            order.items.map((item) =>
              transaction.get(doc(db, "skus", item.sku)),
            ),
          )
        : [];
    const productIds = [...new Set(order.items.map((item) => item.productId))];
    const productDocs =
      reserve || release
        ? await Promise.all(
            productIds.map((productId) =>
              transaction.get(doc(db, "products", productId)),
            ),
          )
        : [];
    const stockBySku = new Map<string, number>();
    records.forEach((skuSnap, index) => {
      const item = order.items[index];
      const sku = skuSnap.data() as SkuRecord;
      if (
        !skuSnap.exists() ||
        (reserve && (!sku.active || sku.stock < item.quantity))
      )
        throw new Error(`${item.name} (${item.variantName}) is out of stock.`);
      const stock = sku.stock + (release ? item.quantity : -item.quantity);
      stockBySku.set(item.sku, stock);
      transaction.update(skuSnap.ref, { stock, updatedAt: serverTimestamp() });
    });
    for (const product of productDocs) {
      if (!product.exists()) continue;
      const variants = (
        product.data().variants as { sku: string; stock: number }[]
      ).map((v) =>
        stockBySku.has(v.sku) ? { ...v, stock: stockBySku.get(v.sku) } : v,
      );
      transaction.update(product.ref, {
        variants,
        updatedAt: serverTimestamp(),
      });
    }

    transaction.update(ref, {
      orderStatus: nextStatus,
      paymentStatus: nextPaymentStatus,
      inventoryReserved: reserve
        ? true
        : release
          ? false
          : order.inventoryReserved,
      ...(action === "verify"
        ? { verifiedAt: serverTimestamp(), verifiedBy: actor }
        : {}),
      rejectionReason: action === "verify" ? "" : rejectionReason,
      trackingNumber: trackingNumber || order.trackingNumber,
      updatedAt: serverTimestamp(),
      history: [
        ...(order.history || []),
        {
          status: nextStatus,
          at: Timestamp.now(),
          actor,
          message:
            action === "verify"
              ? "Payment manually verified by store staff."
              : action === "reject"
                ? `Payment rejected: ${rejectionReason}`
                : reasonOrMessage || `Status changed to ${nextStatus}`,
        },
      ].slice(-40),
    });
  });
}
