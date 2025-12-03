import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDjV2F295wihtPQZuHshqs699sDipz6Yx0",
  authDomain: "webappfinal-1b334.firebaseapp.com",
  projectId: "webappfinal-1b334",
  storageBucket: "webappfinal-1b334.firebasestorage.app",
  messagingSenderId: "936888516722",
  appId: "1:936888516722:web:dacd9be6ac4e8573a482eb",
  measurementId: "G-95NL504WEX",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
