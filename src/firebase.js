import { initializeApp } from "firebase/app";
import {
  getAuth,
  PhoneAuthProvider,
  RecaptchaVerifier,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported, // Added to prevent crashes on unsupported browsers
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBrZFw0drXzLEMoGHrgFVkfxrkjTYE6PPQ",
  authDomain: "skillnest-da917.firebaseapp.com",
  projectId: "skillnest-da917",
  storageBucket: "skillnest-da917.firebasestorage.app",
  messagingSenderId: "951615766032",
  appId: "1:951615766032:web:9d07730fe8de50a1ce5495",
  measurementId: "G-K8QGQD4DME",
};

const app = initializeApp(firebaseConfig);

// Core Services
// ⚠️ THESE THREE EXPORT LINES ARE WHAT WERE MISSING ⚠️
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// =========================================
// PUSH NOTIFICATION SETUP (A1 Standard)
// =========================================
// Initialize Messaging ONLY if the browser supports it (prevents crashes)
export let messaging = null;
if (typeof window !== "undefined" && isSupported()) {
  messaging = getMessaging(app);
}

// Exporting the 2FA tools so they can be used in Login.jsx and AdminSettings.jsx
export const phoneAuthProvider = PhoneAuthProvider;
export const recaptchaVerifier = RecaptchaVerifier;

// ✅ YOUR VAPID KEY HAS BEEN ADDED HERE!
export const VAPID_KEY =
  "BDRUs0Bvw_qMA1poIGBu_pLK7_bDE-sQYnR9XImA9swmnBnZnQmYh37Ar64ht0UyKVE-ryGCJPDDGO0DMCrlDQY";