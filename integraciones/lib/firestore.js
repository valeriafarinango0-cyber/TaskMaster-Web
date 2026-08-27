import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const serviceAccountPath = path.resolve(
  __dirname,
  '..',
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '../serviceAccountKey.json'
);

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
} catch (err) {
  console.error('❌ No se pudo leer la credencial de Firebase en:', serviceAccountPath);
  console.error('   Configura FIREBASE_SERVICE_ACCOUNT_PATH en integraciones/.env apuntando a tu clave de servicio.');
  console.error('   Detalle:', err.message);
  process.exit(1);
}

let app;
try {
  app = initializeApp({ credential: cert(serviceAccount) }, 'integraciones');
} catch (err) {
  console.error('❌ La credencial de Firebase en', serviceAccountPath, 'no es válida.');
  console.error('   Detalle:', err.message);
  process.exit(1);
}

export const db = getFirestore(app);
