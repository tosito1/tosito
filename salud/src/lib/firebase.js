// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCLAB3IW4U6CcXiE_r9t_gkMPVpdFY16g4",
  authDomain: "tosito-7f923.firebaseapp.com",
  projectId: "tosito-7f923",
  storageBucket: "tosito-7f923.firebasestorage.app",
  messagingSenderId: "944852070557",
  appId: "1:944852070557:web:d289d5044471319377a474",
  measurementId: "G-QVVNR83HHT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = typeof window !== "undefined" && typeof navigator !== "undefined" ? getMessaging(app) : null;

export { db, auth, analytics, messaging };
export default app;
