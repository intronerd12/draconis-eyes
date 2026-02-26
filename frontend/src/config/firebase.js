import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

const firebaseConfig = { 
  apiKey: "AIzaSyDip-Z-NmJCI3h8wMbhMlmA2yBrhABOaKI", 
  authDomain: "dragonfruit-22c22.firebaseapp.com", 
  projectId: "dragonfruit-22c22", 
  storageBucket: "dragonfruit-22c22.firebasestorage.app", 
  messagingSenderId: "9746181244", 
  appId: "1:9746181244:web:d5b80f3d44a932bebf2df9", 
  measurementId: "G-09H8LEFKWC" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { app, analytics, auth, googleProvider, facebookProvider };
