import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
const [projectId, uid] = process.argv.slice(2);
if (!projectId || !uid || projectId.startsWith('demo-')) throw new Error('Usage: node scripts/bootstrap-admin.mjs REAL_PROJECT_ID EXISTING_USER_UID. Use application-default credentials on a trusted machine.');
initializeApp({ credential: applicationDefault(), projectId });
const user = await getAuth().getUser(uid);
await getAuth().setCustomUserClaims(uid, { ...user.customClaims, admin: true });
console.log(`Admin claim assigned to ${uid}. Sign out and back in to refresh the token.`);
