// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, Timestamp } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAkjQx6Y2CK6EZNGUi5Os1jdP5mO8xAbB0",
  authDomain: "attendance-tracking-fe451.firebaseapp.com",
  projectId: "attendance-tracking-fe451",
  storageBucket: "attendance-tracking-fe451.firebasestorage.app",
  messagingSenderId: "624133626742",
  appId: "1:624133626742:web:d2ff29f51b14f860cff857",
  measurementId: "G-N67ZB9GCSM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, collection, addDoc, getDocs, query, orderBy, where, Timestamp, auth, signInWithEmailAndPassword, signOut };