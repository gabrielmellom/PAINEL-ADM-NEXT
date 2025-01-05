// src/lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDDKOocXVD7MUs-e_d09lpYpiUT90Qlz9A",
  authDomain: "radio-app-brasil.firebaseapp.com",
  projectId: "radio-app-brasil",
  storageBucket: "radio-app-brasil.appspot.com",
  messagingSenderId: "474017480340",
  appId: "1:474017480340:web:afb5caef452b36af06cfdb"
};

// Initialize Firebase for SSR
let firebase_app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export the instances you need
export const db = getFirestore(firebase_app);
export const auth = getAuth(firebase_app);
export const storage = getStorage(firebase_app);
export default firebase_app;