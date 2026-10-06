import { build } from 'esbuild';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
// This script is intentionally local-only. Production bootstrap uses a separate trusted script.
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
await build({ entryPoints: ['scripts/seed-data.ts'], outfile: '.audit/seed-data.mjs', bundle: true, platform: 'node', format: 'esm', define: { 'import.meta.env': '{}' } });
const { products, business, faqs } = await import(pathToFileURL(resolve('.audit/seed-data.mjs')).href);
initializeApp({ projectId: 'demo-glam-skincare' }); const db = getFirestore(); const auth = getAuth();
for (const [uid, email, password, displayName, admin] of [['local-admin','admin@glam.test','GlamAdmin123!','Glam Admin',true],['local-customer','customer@glam.test','GlamCustomer123!','Demo Customer',false]]) {
  try { await auth.getUser(uid); } catch { await auth.createUser({ uid, email, password, displayName, emailVerified: true }); }
  await auth.setCustomUserClaims(uid, admin ? { admin: true } : {});
  await db.doc(`users/${uid}`).set({ uid, email, displayName, phone: '', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
}
const batch = db.batch();
for (const product of products) {
 batch.set(db.doc(`products/${product.id}`), { ...product, active: true, featured: true, lowStockThreshold: 5, benefits: ['Reusable', 'Soft microfiber', 'Just add warm water'], usage: 'Saturate, sweep gently, rinse and hang to dry.', updatedAt: FieldValue.serverTimestamp() });
 for (const variant of product.variants) batch.set(db.doc(`skus/${variant.sku}`), { productId: product.id, variantId: variant.id, name: product.name, variantName: variant.name, image: variant.image, price: product.price, stock: variant.stock, active: true, lowStockThreshold: 5, updatedAt: FieldValue.serverTimestamp() });
}
batch.set(db.doc('categories/cleansing'), { name: 'Cleansing essentials', active: true });
batch.set(db.doc('settings/store'), { ...business, preview: true, provisional: true, bank: { ...business.bank, enabled: true, name: 'LOCAL TEST ONLY — NOT A BANK', accountTitle: 'Demo checkout — do not transfer funds', accountNumber: '', instructions: 'Emulator test: select any non-sensitive sample image. No real transfer is required or accepted.', wallet: '' } });
batch.set(db.doc('siteContent/home'), { announcement: 'A little water. A little care. A whole new ritual.', heroEyebrow: 'LESS EFFORT. MORE YOU.', heroTitle: 'Goodbye makeup.', heroAccent: 'Hello, soft skin.', heroDescription: 'A little warm water. One beautifully soft pad. Meet the everyday essential that makes taking it all off feel like a little act of self-care.', faqs });
await batch.commit();
console.log('Local Firebase seeded. Admin: admin@glam.test / GlamAdmin123! · Customer: customer@glam.test / GlamCustomer123!');
console.log('These accounts exist only in localhost emulators. No cloud resources were modified.');
