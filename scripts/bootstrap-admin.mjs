import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync, readdirSync } from 'fs';

const [projectId, uid, keyPathInput] = process.argv.slice(2);

if (!projectId || !uid || projectId.startsWith('demo-')) {
  console.error('\nUsage: node scripts/bootstrap-admin.mjs PROJECT_ID USER_UID [PATH_TO_SERVICE_ACCOUNT_JSON]\n');
  process.exit(1);
}

// 1. Check if user passed a specific JSON file path or if standard files exist
let keyPath = keyPathInput;
if (!keyPath) {
  const possibleNames = ['serviceAccountKey.json', 'service-account.json', 'firebase-key.json', 'key.json'];
  for (const name of possibleNames) {
    if (existsSync(name)) {
      keyPath = name;
      break;
    }
  }
}

// 2. Scan directory for any service account JSON file
if (!keyPath) {
  try {
    const files = readdirSync('.');
    for (const file of files) {
      if (
        file.endsWith('.json') &&
        !['package.json', 'package-lock.json', 'tsconfig.json', 'firebase.json', 'firestore.indexes.json'].includes(file)
      ) {
        try {
          const content = readFileSync(file, 'utf8');
          if (content.includes('"type": "service_account"') || content.includes('private_key')) {
            keyPath = file;
            break;
          }
        } catch {
          // ignore unreadable files
        }
      }
    }
  } catch {
    // ignore directory read errors
  }
}

let credential;
if (keyPath && existsSync(keyPath)) {
  console.log(`Using Firebase Service Account key file: ${keyPath}`);
  try {
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
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
  console.log('4. Move the downloaded JSON file into this project folder as "serviceAccountKey.json".');
  console.log('5. Re-run your command:');
  console.log(`   node scripts/bootstrap-admin.mjs ${projectId} ${uid}`);
  console.log('===============================================================\n');
  process.exit(1);
}
