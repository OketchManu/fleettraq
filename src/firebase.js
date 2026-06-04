import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyCmAnw88rGIiVozE1r8BGQbuPOZyD_ZK0c",
  authDomain: "fleet-tracking-system-b80a3.firebaseapp.com",
  projectId: "fleet-tracking-system-b80a3",
  storageBucket: "fleet-tracking-system-b80a3.firebasestorage.app",
  messagingSenderId: "721698552009",
  appId: "1:721698552009:web:5eaff3e25371781c7bb518",
};

const app = initializeApp(firebaseConfig);

const appCheckSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
const appCheckEnabled = process.env.REACT_APP_ENABLE_APP_CHECK === "true";

function startAppCheck() {
  if (!appCheckSiteKey || !appCheckEnabled) return;
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

if (appCheckSiteKey && appCheckEnabled && typeof window !== "undefined") {
  // Defer App Check so login and first paint are not blocked on reCAPTCHA.
  const scheduleAppCheck = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
  scheduleAppCheck(startAppCheck);
} else if (process.env.NODE_ENV === "development" && process.env.REACT_APP_APPCHECK_DEBUG_TOKEN) {
  // App Check debug token for local development only.
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.REACT_APP_APPCHECK_DEBUG_TOKEN;
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Offline persistence disabled: stale cached assignments reappeared for drivers after
// admin unassign when Firestore hit quota limits. Server data is the source of truth.

googleProvider.setCustomParameters({
  prompt: "select_account",
});

export { auth, db, storage, googleProvider };
export default app;
