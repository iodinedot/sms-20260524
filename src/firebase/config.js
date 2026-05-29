// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCxTwUJiySyKD6nak6O5kaci-s7ZEE471s",
  authDomain: "school-management-system-72abb.firebaseapp.com",
  projectId: "school-management-system-72abb",
  storageBucket: "school-management-system-72abb.firebasestorage.app",
  messagingSenderId: "102050436879",
  appId: "1:102050436879:web:4c7fda91f91c7603ee907a",
  measurementId: "G-C71CJDM52Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// 取得 Firestore 資料庫實體
const db = getFirestore(app);
// 匯出 db
export { db };