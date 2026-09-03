import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // 🟢 En Railway: Parsea el JSON directamente desde la variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
} else {
  // 🟡 En Local: Lee el archivo físico local
  const keyPath = path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'taskmaster-web-dbcd0-firebase-adminsdk-fbsvc-7ae8ae36dd.json');
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'));
}

initializeApp({ credential: cert(serviceAccount) });

export const db = getFirestore();