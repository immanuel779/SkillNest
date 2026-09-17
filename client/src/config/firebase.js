import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyDzU2vdIxnmvIzKKRoKIZmeXB3xYCQkNm8',
  authDomain: 'skillnest-mvp-b4bef.firebaseapp.com',
  projectId: 'skillnest-mvp-b4bef',
  storageBucket: 'skillnest-mvp-b4bef.firebasestorage.app',
  messagingSenderId: '251553022844',
  appId: '1:251553022844:web:01b3b4bc671674d7251af9',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)