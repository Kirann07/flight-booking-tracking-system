import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD0Hk2B_CAlZ0PrhzicD3C8eabhIJ8UU6Q",
  authDomain: "flight-booking-system-c7d12.firebaseapp.com",
  projectId: "flight-booking-system-c7d12",
  storageBucket: "flight-booking-system-c7d12.firebasestorage.app",
  messagingSenderId: "261911265616",
  appId: "1:261911265616:web:09528049f63fa1cdf2ec55",
  measurementId: "G-275LZTTT51"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);