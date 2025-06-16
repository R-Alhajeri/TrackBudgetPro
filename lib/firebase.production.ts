/**
 * Firebase Production Configuration
 *
 * This file contains the production-specific Firebase configuration
 * that should be used when deploying to production environments.
 */

import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Production Firebase configuration
const productionConfig = {
  apiKey: "AIzaSyBJqI3VvPLuGj4DqV1cK2O8zH5wR9xE7mN",
  authDomain: "elegantbudgettracker.firebaseapp.com",
  projectId: "elegantbudgettracker",
  storageBucket: "elegantbudgettracker.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345",
  measurementId: "G-XXXXXXXXXX",
};

// Initialize Firebase for production
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

try {
  app = initializeApp(productionConfig);
  auth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);

  console.log("🚀 Production Firebase initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize production Firebase:", error);
  throw error;
}

export { app, auth, firestore, storage };
export default { app, auth, firestore, storage };
