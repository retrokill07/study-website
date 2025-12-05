import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// REPLACE WITH YOUR FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "",
  authDomain: "study-app-29c11.firebaseapp.com",
  projectId: "study-app-29c11",
  storageBucket: "study-app-29c11.firebasestorage.app",
  messagingSenderId: "128844047012",
  appId: "1:128844047012:web:1776a6fb38ae74e1abfc31",
  measurementId: "G-3QQYE0XZS2"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);