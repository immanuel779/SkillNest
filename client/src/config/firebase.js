import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
} from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Prevent duplicate initialization during Vite HMR
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

// Auth with local persistence (users stay logged in across sessions)
let authInstance
try {
  authInstance = initializeAuth(app, {
    persistence: browserLocalPersistence,
  })
} catch {
  // Already initialized (HMR) — reuse the existing instance
  authInstance = getAuth(app)
}

// Firestore with offline cache + multi-tab sync
let dbInstance
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  })
} catch {
  // Already initialized (HMR) — reuse the existing instance
  dbInstance = getFirestore(app)
}

export const auth = authInstance
export const db = dbInstance