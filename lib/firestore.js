import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // 🟢 En Railway: Usa el contenido del JSON pegado en la variable de entorno
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // 🟡 En desarrollo local: Lee el archivo físico local
  const keyPath = path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'serviceAccountKey.json');
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'));
}

initializeApp({ credential: cert(serviceAccount) });

export const db = getFirestore();