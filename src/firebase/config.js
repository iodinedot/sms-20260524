// Firebase core
import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCxTwUJiySyKD6nak6O5kaci-s7ZEE471s",
  authDomain: "school-management-system-72abb.firebaseapp.com",
  projectId: "school-management-system-72abb",
  storageBucket: "school-management-system-72abb.firebasestorage.app",
  messagingSenderId: "102050436879",
  appId: "1:102050436879:web:4c7fda91f91c7603ee907a",
  measurementId: "G-C71CJDM52Z"
}

// Init app
const app = initializeApp(firebaseConfig)

// Services
const analytics = getAnalytics(app)
const db = getFirestore(app)
const auth = getAuth(app)

// exports
export { app, db, auth }