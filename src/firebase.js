import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your specific Brentwood config
const firebaseConfig = {
  apiKey: "AIzaSyBrSZwGfyvTfnv_zRFN-4_V9u10W7jvsiE",
  authDomain: "brentwood-olympics.firebaseapp.com",
  projectId: "brentwood-olympics",
  storageBucket: "brentwood-olympics.firebasestorage.app",
  messagingSenderId: "581308844500",
  appId: "1:581308844500:web:89dbc0f90fef1405d4ae41"
};

// Initialize connections
const app = initializeApp(firebaseConfig);

// Export them so other files can use them
export const db = getFirestore(app);
export const auth = getAuth(app);