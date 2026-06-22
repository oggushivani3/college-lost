import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCfxZwb1c4_aeWEy54JP1O5HsYPeavJkxY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'vits-lostfound.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'vits-lostfound',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'vits-lostfound.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '439324966372',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:439324966372:web:88a6edbe507681d387dbf1'
};

let auth = null;
let googleProvider = null;
let db = null;
let storage = null;

const hasFirebaseKeys = true;

if (hasFirebaseKeys) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
}

export { auth, googleProvider, db, storage };
