// assets/js/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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