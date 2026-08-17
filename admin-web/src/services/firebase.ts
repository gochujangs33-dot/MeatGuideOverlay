import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyExampleKeyAdminWeb123456789",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "meat-guide-overlay.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "meat-guide-overlay",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "meat-guide-overlay.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const firestore = db;
export const storage = getStorage(app);

// Connect to emulators if configured
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
const emulatorHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || 'localhost';

if (useEmulator && typeof window !== 'undefined' && !(window as any)._firebaseEmulatorsConnected) {
  try {
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, emulatorHost, 8080);
    connectStorageEmulator(storage, emulatorHost, 9199);
    (window as any)._firebaseEmulatorsConnected = true;
    console.log(`[Firebase] Connected to local emulators at ${emulatorHost}`);
  } catch (e) {
    console.warn('[Firebase] Emulator connection skipped or already initialized:', e);
  }
}

export { doc, getDoc, setDoc, onSnapshot, collection, getDocs, signInAnonymously, onAuthStateChanged };
export type { User };
