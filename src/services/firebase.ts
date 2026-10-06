import { initializeApp, getApps } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { runtime } from '../config/runtime';
function initialize() {
  if (!runtime.configured) return null;
  const existing = getApps()[0];
  const app = existing || initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${runtime.projectId}.firebaseapp.com`,
    projectId: runtime.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${runtime.projectId}.appspot.com`,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-glam-app',
  });
  const auth = getAuth(app); const db = getFirestore(app); const storage = getStorage(app);
  if (runtime.emulators && !existing) {
    connectAuthEmulator(auth, `http://${runtime.emulatorHost}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, runtime.emulatorHost, 8080);
    connectStorageEmulator(storage, runtime.emulatorHost, 9199);
  }
  return { app, auth, db, storage };
}
export const firebase = initialize();
export function requireFirebase() { if (!firebase) throw new Error('The store connection is not configured. Start the local Firebase emulators or add your Firebase web configuration.'); return firebase; }
export async function getFirebaseServices() { return firebase; }
