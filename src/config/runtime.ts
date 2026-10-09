export const runtime = {
  emulators: import.meta.env.VITE_USE_EMULATORS === 'true',
  configured: import.meta.env.VITE_USE_EMULATORS === 'true' || Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_APP_ID),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-glam-skincare',
  emulatorHost: import.meta.env.VITE_EMULATOR_HOST || '127.0.0.1',
};
