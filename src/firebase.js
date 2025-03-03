import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
// Replace these values with your actual Firebase project details
const firebaseConfig = {
    apiKey: "AIzaSyC2A5X47cdefTvYhmfnoKWVqB2tKR5s5oE",
    authDomain: "nxtstride-goals.firebaseapp.com",
    projectId: "nxtstride-goals",
    storageBucket: "nxtstride-goals.firebasestorage.app",
    messagingSenderId: "103152358626",
    appId: "1:103152358626:web:61d2bb937baf583c30fabb",
    measurementId: "G-VPQJWXG1F3"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Restrict to your domain
googleProvider.setCustomParameters({
  'hd': 'nxtstride.com'
});

export { auth, db, googleProvider };