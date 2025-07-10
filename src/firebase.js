// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD9tuzkI42iTN09-CPqdwcFAgQGeSGyf2o",
  authDomain: "music-player-bf255.firebaseapp.com",
  projectId: "music-player-bf255",
  storageBucket: "music-player-bf255.appspot.com", // ✅ Corrected bucket domain
  messagingSenderId: "609283781670",
  appId: "1:609283781670:web:2dc90fa95251283faf22e7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Export all
export { auth, db, storage, googleProvider };
