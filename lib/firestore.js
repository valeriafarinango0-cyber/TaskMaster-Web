import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const keyPath = path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });

export const db = getFirestore();
