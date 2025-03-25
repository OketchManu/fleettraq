import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Add this import

const firebaseConfig = {
  apiKey: "AIzaSyBZFuecOLpuSTSt1sf8HUTOgQdB3WpyRx4",
  authDomain: "fleettraq1.firebaseapp.com",
  projectId: "fleettraq1",
  storageBucket: "fleettraq1.firebasestorage.app",
  messagingSenderId: "335391604526",
  appId: "1:335391604526:web:1915e0a571c928409d84bf",
  measurementId: "G-86SB227232"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); // Initialize and export Firestore