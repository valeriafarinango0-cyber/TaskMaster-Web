// assets/js/firebase-init.js
// Inicializa Firebase y expone Firestore + los helpers que usa TaskModel.js
// para la sincronización en tiempo real (ver assets/js/model/TaskModel.js).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCEnQsMgJ-oK0R8OvrzVuQ3oNqNZ10j7A8",
  authDomain: "taskmaster-web-e81b4.firebaseapp.com",
  projectId: "taskmaster-web-e81b4",
  storageBucket: "taskmaster-web-e81b4.firebasestorage.app",
  messagingSenderId: "1091385704837",
  appId: "1:1091385704837:web:66b0bf6101653e2e6c04ec",
  measurementId: "G-26NQ3HZTT7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { collection, doc, setDoc, deleteDoc, onSnapshot };

// TaskModel.js se carga como script clasico (no module), asi que expone
// aqui lo necesario en window para que pueda sincronizar con Firestore.
window.__firebase = { db, collection, doc, setDoc, deleteDoc, onSnapshot };
window.dispatchEvent(new Event('firebase-ready'));
