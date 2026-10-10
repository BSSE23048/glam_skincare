import {
  collection,
  query,
  where,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { requireFirebase } from "./firebase";
import type { StoreProduct } from "../domain/models";

export async function saveProduct(input: StoreProduct) {
  const { db } = requireFirebase();
  const {
    costPrice = 0,
    packagingCost = 0,
    handlingCost = 0,
    ...product
  } = input;
  if (!product.name.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug))
    throw new Error("Enter a name and a lowercase, hyphen-separated slug.");
  if (
    ![
      product.price,
      costPrice,
      packagingCost,
      handlingCost,
      product.lowStockThreshold,
    ].every((n) => Number.isFinite(n) && n >= 0) ||
    product.price <= 0
  )
    throw new Error(
      "Price must be positive; costs and thresholds cannot be negative.",
    );
  if (product.compareAt && product.compareAt < product.price)
    throw new Error(
      "Compare-at price must be at least the sale price, or zero to remove the sale.",
    );
  if (
    !product.variants.length ||
    new Set(product.variants.map((v) => v.sku)).size !==
      product.variants.length ||
    new Set(product.variants.map((v) => v.id)).size !== product.variants.length
  )
    throw new Error("Every variant needs a unique SKU and ID.");
  if (
    product.variants.some(
      (v) =>
        !v.sku ||
        /\//.test(v.sku) ||
        !Number.isInteger(v.stock) ||
        v.stock < 0 ||
        (v.priceOverride !== undefined &&
          (!Number.isFinite(v.priceOverride) || v.priceOverride <= 0)),
    )
  )
    throw new Error(
      "Check variant SKUs, prices, and nonnegative whole-number stock.",
    );
  if (
    product.images.some(
      (src) => !src.startsWith("/images/") && !/^https:\/\//.test(src),
    )
  )
    throw new Error("Use local /images/ paths or HTTPS product image URLs.");
  const matchingSlugs = await getDocs(
    query(collection(db, "products"), where("slug", "==", product.slug)),
  );
  if (matchingSlugs.docs.some((d) => d.id !== product.id))
    throw new Error("That product slug is already in use.");
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "products", product.id);
    const previous = await tx.get(ref);
    const slugRef = doc(db, "productSlugs", product.slug);
    const slug = await tx.get(slugRef);
    if (slug.exists() && slug.data().productId !== product.id)
      throw new Error("That product slug is already in use.");
    const skuRefs = product.variants.map((v) => doc(db, "skus", v.sku));
    const existingSkus = await Promise.all(skuRefs.map((r) => tx.get(r)));
    existingSkus.forEach((s) => {
      if (s.exists() && s.data().productId !== product.id)
        throw new Error("A SKU is already assigned to another product.");
    });
    tx.set(ref, { ...product, updatedAt: serverTimestamp() });
    tx.set(slugRef, { productId: product.id });
    const old = previous.data() as StoreProduct | undefined;
    if (old?.slug && old.slug !== product.slug)
      tx.delete(doc(db, "productSlugs", old.slug));
    for (const v of old?.variants || [])
      if (!product.variants.some((next) => next.sku === v.sku))
        tx.update(doc(db, "skus", v.sku), {
          active: false,
          updatedAt: serverTimestamp(),
        });
    product.variants.forEach((v, index) =>
      tx.set(skuRefs[index], {
        productId: product.id,
        variantId: v.id,
        name: product.name,
        variantName: v.name,
        image: v.image || product.images[0],
        price: v.priceOverride ?? product.price,
        stock: v.stock,
        active: product.active && v.active !== false,
        lowStockThreshold: product.lowStockThreshold,
        updatedAt: serverTimestamp(),
      }),
    );
    tx.set(doc(db, "productCosts", product.id), {
      productId: product.id,
      costPrice,
      packagingCost,
      handlingCost,
      updatedAt: serverTimestamp(),
    });
  });
}
export async function setProductActive(id: string, active: boolean) {
  const { db } = requireFirebase();
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "products", id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Product not found.");
    const p = snap.data() as StoreProduct;
    tx.update(ref, { active, updatedAt: serverTimestamp() });
    p.variants.forEach((v) =>
      tx.update(doc(db, "skus", v.sku), {
        active: active && v.active !== false,
        updatedAt: serverTimestamp(),
      }),
    );
  });
}
export async function adjustStock(
  productId: string,
  variantId: string,
  delta: number,
) {
  const { db } = requireFirebase();
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "products", productId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Product not found.");
    const product = snap.data() as StoreProduct;
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) throw new Error("Variant not found.");
    const skuRef = doc(db, "skus", variant.sku);
    const sku = await tx.get(skuRef);
    if (!sku.exists()) throw new Error("SKU not found.");
    const stock = sku.data().stock + delta;
    if (!Number.isInteger(stock) || stock < 0)
      throw new Error("Stock cannot become negative.");
    tx.update(skuRef, { stock, updatedAt: serverTimestamp() });
    tx.update(ref, {
      variants: product.variants.map((v) =>
        v.id === variantId ? { ...v, stock } : v,
      ),
      updatedAt: serverTimestamp(),
    });
  });
}
