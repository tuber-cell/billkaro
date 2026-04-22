import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDvfRTDul7CnlwW_casoslvAwEDhvOvbv0",
  authDomain: "pixtrim.firebaseapp.com",
  projectId: "pixtrim",
  storageBucket: "pixtrim.firebasestorage.app",
  messagingSenderId: "268832698971",
  appId: "1:268832698971:web:2991712732b74fa4bbc57e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
