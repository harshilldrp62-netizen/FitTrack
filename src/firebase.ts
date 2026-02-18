import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCNEky4Sc-EV-OraCGshowzfXt6A2Y-PEw",
  authDomain: "fittrack-7efb7.firebaseapp.com",
  projectId: "fittrack-7efb7",
  storageBucket: "fittrack-7efb7.firebasestorage.app",
  messagingSenderId: "108331200411",
  appId: "1:108331200411:web:ef6ff3678d45357dccbb3e"
};

console.log("[Firebase] 🔧 Initializing with config:");
console.log("[Firebase] projectId:", firebaseConfig.projectId);
console.log("[Firebase] authDomain:", firebaseConfig.authDomain);

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
console.log("[Firebase] ✅ Auth instance created");

// Ensure auth state persists across app restarts until the user signs out.
// Use browserLocalPersistence where available; gracefully ignore errors (e.g., in some native environments).
setPersistence(auth, browserLocalPersistence).catch((err) => {
  // Not fatal — auth will use its default persistence if this fails.
  // Log for debugging in case persistence can't be set in the current environment.
  // eslint-disable-next-line no-console
  console.warn("[Firebase] ⚠️ Could not set auth persistence:", err);
});
export const db = getFirestore(app);
