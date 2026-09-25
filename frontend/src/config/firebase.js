// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDPbjxSXDwu3nCGP3rQebXyibFLKfFeWZw",
  authDomain: "outletmangement.firebaseapp.com",
  projectId: "outletmangement",
  storageBucket: "outletmangement.firebasestorage.app",
  messagingSenderId: "541834788565",
  appId: "1:541834788565:web:a1b2a77febd139f9aa6c5c",
  measurementId: "G-XE8Z97EP7J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const messaging = getMessaging(app);
export { getToken, onMessage };
console.log("Firebase initialized");