// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9RdcOGSqSOp3L8nu4FCA-JRYiZZIDNZo",
  authDomain: "gastos-personales-6b7f1.firebaseapp.com",
  databaseURL: "https://gastos-personales-6b7f1-default-rtdb.firebaseio.com",
  projectId: "gastos-personales-6b7f1",
  storageBucket: "gastos-personales-6b7f1.firebasestorage.app",
  messagingSenderId: "697290075240",
  appId: "1:697290075240:web:65f129fc90fac3361ddfdd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);