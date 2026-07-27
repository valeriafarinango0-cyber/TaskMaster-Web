import { db } from './firestore.js';

const COL = 'int_oauth_tokens';

export async function guardarTokens(proveedor, datos) {
  await db.collection(COL).doc(proveedor).set(
    { ...datos, actualizado: new Date().toISOString() },
    { merge: true }
  );
}

export async function leerTokens(proveedor) {
  const doc = await db.collection(COL).doc(proveedor).get();
  return doc.exists ? doc.data() : null;
}

export async function estaConectado(proveedor) {
  const t = await leerTokens(proveedor);
  return !!(t && t.refresh_token);
}
