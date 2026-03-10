import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = { 
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDip-Z-NmJCI3h8wMbhMlmA2yBrhABOaKI", 
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dragonfruit-22c22.firebaseapp.com", 
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dragonfruit-22c22", 
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dragonfruit-22c22.firebasestorage.app", 
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "9746181244", 
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:9746181244:web:d5b80f3d44a932bebf2df9", 
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-09H8LEFKWC" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, googleProvider };
