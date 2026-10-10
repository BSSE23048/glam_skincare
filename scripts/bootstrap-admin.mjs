import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';

const [projectId, uid, keyPathInput] = process.argv.slice(2);

if (!projectId || !uid || projectId.startsWith('demo-')) {
  console.error('\nUsage: node scripts/bootstrap-admin.mjs PROJECT_ID USER_UID [PATH_TO_SERVICE_ACCOUNT_JSON]\n');
  process.exit(1);
}

// Credentials must be explicitly selected, or supplied through ADC.
// Never scan the repository for private keys.
const keyPath = keyPathInput;

let credential;
if (keyPath && existsSync(keyPath)) {
  console.log(`Using Firebase Service Account key file: ${keyPath}`);
  try {
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
    if (serviceAccount.project_id !== projectId) throw new Error('Credential project does not match the requested project.');
    credential = cert(serviceAccount);
  } catch (err) {
    console.error(`Failed to parse ${keyPath}: ${err.message}`);
    process.exit(1);
  }
} else {
  console.log('No local service account JSON file found. Trying Application Default Credentials...');
  credential = applicationDefault();
}

try {
  initializeApp({ credential, projectId });
  const auth = getAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: true });
  console.log(`\n SUCCESS! Admin claim assigned to user UID: ${uid} (${user.email || 'No email'}).`);
  console.log('Please sign out of the website and sign back in to refresh your admin session token.\n');
} catch (err) {
  console.error('\n Could not authorize with Firebase Admin SDK.');
  console.error(`Error details: ${err.message}`);
  console.log('\n===============================================================');
  console.log('HOW TO RESOLVE (1-Minute Setup):');
  console.log('===============================================================');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
  console.log(`2. Open project "${projectId}" -> Project Settings (gear icon) -> "Service accounts" tab.`);
  console.log('3. Click "Generate new private key" to download your service account JSON file.');
  console.log('4. Keep the private key outside this repository and pass its path explicitly.');
  console.log('5. Re-run your command:');
  console.log(`   node scripts/bootstrap-admin.mjs ${projectId} ${uid}`);
  console.log('===============================================================\n');
  process.exit(1);
}
