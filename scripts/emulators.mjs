import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { resolve, join, delimiter } from 'node:path';
const env = { ...process.env, FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true' };
const portable = resolve('.audit/java');
if (existsSync(portable)) { const folder = readdirSync(portable).find(name => existsSync(join(portable, name, 'bin', 'java.exe'))); if (folder) { env.JAVA_HOME = join(portable, folder); env.PATH = `${join(env.JAVA_HOME, 'bin')}${delimiter}${env.PATH}`; } }
const child = spawn(process.execPath, ['node_modules/firebase-tools/lib/bin/firebase.js', 'emulators:start', '--project', 'demo-glam-skincare', '--only', 'auth,firestore'], { env, stdio: 'inherit', windowsHide: true });
child.on('exit', code => process.exit(code || 0));
