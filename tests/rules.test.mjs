import { test, before, after } from "node:test";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-glam-rules",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await setDoc(doc(db, "settings/store"), {
      shipping: { fee: 200, freeAbove: 2500 },
      bank: { enabled: true },
    });
    await setDoc(doc(db, "products/p"), { active: true });
    await setDoc(doc(db, "productCosts/p"), { costPrice: 300 });
    await setDoc(doc(db, "skus/PINK"), {
      active: true,
      price: 850,
      stock: 5,
      productId: "p",
      variantId: "pink",
      name: "Pad",
      variantName: "Pink",
      image: "/images/pink-pad.jpeg",
    });
    await setDoc(doc(db, "orders/GS-OTHER"), { userId: "other", total: 1000 });
  });
});
after(async () => {
  await env?.cleanup();
});
test("email alone never grants admin; custom claim does", async () => {
  const fake = env
    .authenticatedContext("fake", { email: "glamskincarepk@gmail.com" })
    .firestore();
  await assertFails(getDoc(doc(fake, "productCosts/p")));
  const admin = env.authenticatedContext("admin", { admin: true }).firestore();
  await assertSucceeds(getDoc(doc(admin, "productCosts/p")));
  await assertSucceeds(getDocs(collection(admin, "orders")));
});
test("public catalog is readable; private costs and other customer orders are denied", async () => {
  const anon = env.unauthenticatedContext().firestore();
  const customer = env
    .authenticatedContext("customer", { email: "customer@glam.test" })
    .firestore();
  await assertSucceeds(getDoc(doc(anon, "products/p")));
  await assertFails(getDoc(doc(anon, "orders/GS-OTHER")));
  await assertFails(getDoc(doc(customer, "orders/GS-OTHER")));
  await assertFails(getDoc(doc(customer, "productCosts/p")));
  await assertFails(getDocs(collection(customer, "orders")));
  await assertSucceeds(
    getDocs(
      query(collection(customer, "orders"), where("userId", "==", "customer")),
    ),
  );
  await assertFails(updateDoc(doc(customer, "skus/PINK"), { stock: 999 }));
});
function orderBatch(uid, overrides = {}) {
  const db = env
    .authenticatedContext(uid, { email: "customer@glam.test" })
    .firestore();
  const id = "GS-" + uid.toUpperCase();
  const order = {
    orderNumber: id,
    userId: uid,
    customer: {
      name: "Test",
      email: "customer@glam.test",
      phone: "03001234567",
      whatsapp: "",
      address: "Test Road",
      apartment: "",
      area: "Area",
      city: "Lahore",
      province: "Punjab",
      postalCode: "",
      instructions: "",
    },
    items: [
      {
        sku: "PINK",
        productId: "p",
        variantId: "pink",
        name: "Pad",
        variantName: "Pink",
        image: "/images/pink-pad.jpeg",
        unitPrice: 850,
        quantity: 1,
        lineTotal: 850,
      },
    ],
    subtotal: 850,
    shipping: 200,
    total: 1050,
    paymentMethod: "cod",
    paymentStatus: "cod_pending",
    orderStatus: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    inventoryReserved: false,
    verifiedAt: null,
    verifiedBy: "",
    rejectionReason: "",
    trackingNumber: "",
    history: [],
    ...overrides,
  };
  const batch = writeBatch(db);
  batch.set(doc(db, "orders", id), order);
  batch.set(doc(db, "users", uid, "limits/checkout"), {
    lastOrderAt: serverTimestamp(),
    orderId: id,
  });
  return batch;
}
test("valid checkout transaction succeeds", async () => {
  await assertSucceeds(orderBatch("valid").commit());
});
test("maximum five distinct variants fit the rules evaluation budget", async () => {
  const items = [];
  await env.withSecurityRulesDisabled(async (c) => {
    for (let i = 0; i < 5; i++) {
      const sku = `SKU${i}`;
      await setDoc(doc(c.firestore(), "skus", sku), {
        active: true,
        price: 850,
        stock: 5,
        productId: "p",
        variantId: sku,
        name: "Pad",
        variantName: sku,
        image: "/images/pink-pad.jpeg",
      });
      items.push({
        sku,
        productId: "p",
        variantId: sku,
        name: "Pad",
        variantName: sku,
        image: "/images/pink-pad.jpeg",
        unitPrice: 850,
        quantity: 1,
        lineTotal: 850,
      });
    }
  });
  await assertSucceeds(
    orderBatch("five", {
      items,
      subtotal: 4250,
      shipping: 0,
      total: 4250,
    }).commit(),
  );
});
test("forged totals, verification and history are denied", async () => {
  await assertFails(orderBatch("total", { total: 1 }).commit());
  await assertFails(
    orderBatch("verify", { paymentStatus: "verified" }).commit(),
  );
  await assertFails(
    orderBatch("history", { history: [{ status: "delivered" }] }).commit(),
  );
});
test("admin cannot publish private costs or negative inventory", async () => {
  const db = env.authenticatedContext("admin", { admin: true }).firestore();
  await assertFails(
    setDoc(doc(db, "products/leak"), { active: true, costPrice: 300 }),
  );
  await assertFails(updateDoc(doc(db, "skus/PINK"), { stock: -1 }));
});
test("customer cannot rewrite order status, submit duplicate lines or exceed stock", async () => {
  const db = env
    .authenticatedContext("valid", { email: "customer@glam.test" })
    .firestore();
  await assertFails(
    updateDoc(doc(db, "orders/GS-VALID"), {
      orderStatus: "delivered",
      updatedAt: serverTimestamp(),
    }),
  );
  const line = {
    sku: "PINK",
    productId: "p",
    variantId: "pink",
    name: "Pad",
    variantName: "Pink",
    image: "/images/pink-pad.jpeg",
    unitPrice: 850,
    quantity: 1,
    lineTotal: 850,
  };
  await assertFails(
    orderBatch("dupes", {
      items: [line, line],
      subtotal: 1700,
      total: 1900,
    }).commit(),
  );
  await assertFails(
    orderBatch("stock", {
      items: [{ ...line, quantity: 6, lineTotal: 5100 }],
      subtotal: 5100,
      shipping: 0,
      total: 5100,
    }).commit(),
  );
});
test("reviews require a delivered purchase and cannot self-approve", async () => {
  const db = env
    .authenticatedContext("valid", { email: "customer@glam.test" })
    .firestore();
  const review = {
    orderId: "GS-VALID",
    productId: "p",
    userId: "valid",
    author: "Test",
    rating: 5,
    body: "Test review",
    status: "pending",
    verifiedPurchase: true,
    createdAt: serverTimestamp(),
  };
  await assertFails(setDoc(doc(db, "reviews/GS-VALID_p"), review));
  await env.withSecurityRulesDisabled((c) =>
    updateDoc(doc(c.firestore(), "orders/GS-VALID"), {
      orderStatus: "delivered",
    }),
  );
  await assertFails(
    setDoc(doc(db, "reviews/GS-VALID_p"), { ...review, status: "approved" }),
  );
  await assertSucceeds(setDoc(doc(db, "reviews/GS-VALID_p"), review));
  await assertFails(
    updateDoc(doc(db, "reviews/GS-VALID_p"), { status: "approved" }),
  );
});
