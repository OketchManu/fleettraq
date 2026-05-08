import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your Firebase configuration - REPLACE WITH YOUR OWN
const firebaseConfig = {
  apiKey: "AIzaSyBZFuecOLpuSTSt1sf8HUTOgQdB3WpyRx4",
  authDomain: "fleettraq1.firebaseapp.com",
  projectId: "fleettraq1",
  storageBucket: "fleettraq1.firebasestorage.app",
  messagingSenderId: "335391604526",
  appId: "1:335391604526:web:1915e0a571c928409d84bf",
  measurementId: "G-86SB227232"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support offline persistence.');
  }
});

// Configure Google Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, db, googleProvider };
export default app;