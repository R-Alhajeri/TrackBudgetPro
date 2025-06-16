import { Platform } from "react-native";

// Import Firebase modules at the top level to ensure they're loaded
import { initializeApp, FirebaseApp } from "firebase/app";
import {
  Auth,
  getAuth,
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseCreateUser,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  updateProfile as firebaseUpdateProfile,
  User,
} from "firebase/auth";
import {
  Firestore,
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import {
  FirebaseStorage,
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Firebase configuration - Direct values for demo/development
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyC9gEIBwHA1jzf4kOl9i9H1hstn0zjbKJ8",
  authDomain: "elegantbudgettracker.firebaseapp.com",
  projectId: "elegantbudgettracker",
  storageBucket: "elegantbudgettracker.firebasestorage.app",
  messagingSenderId: "744936464635",
  appId: "1:744936464635:web:4501f27744ca17a1c9505e",
  measurementId: "G-JGS5JHZFTK",
};

// Firebase instance variables
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseFirestore: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;

// Import AsyncStorage conditionally for React Native platforms
let AsyncStorage: any = null;
if (Platform.OS !== "web") {
  try {
    AsyncStorage = require("@react-native-async-storage/async-storage").default;
  } catch (error) {
    console.warn("AsyncStorage not available:", error);
    AsyncStorage = null;
  }
}

// Set up mock Firebase implementation for development/demo purposes
const setupMockFirebase = () => {
  console.log("Setting up mock Firebase implementation");

  // Mock user data for admin panel testing
  const mockUsers = [
    {
      uid: "mock-admin-1",
      email: "admin@example.com",
      displayName: "Admin User",
      disabled: false,
      metadata: {
        creationTime: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
      customClaims: { role: "admin" },
    },
    {
      uid: "mock-user-1",
      email: "user1@example.com",
      displayName: "Regular User 1",
      disabled: false,
      metadata: {
        creationTime: new Date(
          Date.now() - 15 * 24 * 60 * 60 * 1000
        ).toISOString(),
        lastSignInTime: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      customClaims: { role: "user" },
    },
    {
      uid: "mock-user-2",
      email: "user2@example.com",
      displayName: "Regular User 2",
      disabled: true,
      metadata: {
        creationTime: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        lastSignInTime: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      customClaims: { role: "user" },
    },
  ];

  // Mock auth with admin functionality
  const mockAuth = {
    currentUser: {
      uid: "mock-admin-1",
      email: "admin@example.com",
      displayName: "Admin User",
    },
    onAuthStateChanged: (callback: any) => {
      // Simulate auth state
      setTimeout(() => callback(mockAuth.currentUser), 100);
      return () => {}; // unsubscribe function
    },
    signInWithEmailAndPassword: async (email: string, password: string) => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
      const user = mockUsers.find((u) => u.email === email);
      if (user && !user.disabled) {
        return { user };
      }
      throw new Error("Invalid credentials or user disabled");
    },
    createUserWithEmailAndPassword: async (email: string, password: string) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newUser = {
        uid: `mock-user-${Date.now()}`,
        email,
        displayName: email.split("@")[0],
        disabled: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        customClaims: { role: "user" },
      };
      mockUsers.push(newUser);
      return { user: newUser };
    },
    signOut: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return Promise.resolve();
    },
    sendPasswordResetEmail: async (email: string) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`Mock: Password reset email sent to ${email}`);
      return Promise.resolve();
    },
  };

  // Mock Firestore with admin capabilities
  const mockFirestore = {
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => ({
          exists: () => true,
          data: () => ({ id, name: "Mock Data" }),
          id: id,
        }),
        set: async (data: any) => {
          console.log(
            `Mock Firestore: Setting document ${id} in ${name}:`,
            data
          );
          return Promise.resolve();
        },
        update: async (data: any) => {
          console.log(
            `Mock Firestore: Updating document ${id} in ${name}:`,
            data
          );
          return Promise.resolve();
        },
        delete: async () => {
          console.log(`Mock Firestore: Deleting document ${id} in ${name}`);
          return Promise.resolve();
        },
      }),
      add: async (data: any) => {
        console.log(`Mock Firestore: Adding document to ${name}:`, data);
        return Promise.resolve({ id: "mock-id-" + Date.now() });
      },
      where: () => ({
        get: async () => ({
          docs: mockUsers.map((user) => ({
            id: user.uid,
            data: () => user,
          })),
        }),
      }),
      get: async () => ({
        docs: mockUsers.map((user) => ({
          id: user.uid,
          data: () => user,
        })),
      }),
    }),
    // Mock admin functions
    getMockUsers: () => mockUsers,
    updateMockUser: (uid: string, updates: any) => {
      const userIndex = mockUsers.findIndex((u) => u.uid === uid);
      if (userIndex !== -1) {
        mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
        console.log(`Mock: Updated user ${uid}:`, updates);
      }
    },
    deleteMockUser: (uid: string) => {
      const userIndex = mockUsers.findIndex((u) => u.uid === uid);
      if (userIndex !== -1) {
        mockUsers.splice(userIndex, 1);
        console.log(`Mock: Deleted user ${uid}`);
      }
    },
  } as any;

  firebaseFirestore = mockFirestore;
  firebaseAuth = mockAuth as any;

  return {
    app: {} as any,
    auth: mockAuth as any,
    firestore: mockFirestore as any,
    storage: {} as any,
  };
};

// Initialize Firebase function
export const initializeFirebase = async (config?: FirebaseConfig) => {
  if (firebaseApp) {
    console.log("Firebase already initialized");
    return {
      app: firebaseApp,
      auth: firebaseAuth,
      firestore: firebaseFirestore,
      storage: firebaseStorage,
    };
  }

  try {
    console.log("Initializing Firebase...");

    // Use provided config or default config
    const configToUse = config || firebaseConfig;

    // Check for valid config
    if (
      !configToUse.apiKey ||
      !configToUse.authDomain ||
      !configToUse.projectId
    ) {
      console.warn(
        "Firebase configuration is incomplete. Using mock Firebase implementation."
      );
      return setupMockFirebase();
    }

    // Check if we're in Expo Go environment (which has Firebase limitations)
    const isExpoGo =
      typeof global !== "undefined" &&
      (global as any)?.__expo &&
      (global as any)?.__expo?.manifest;

    // Also check for React Native without dev mode (typical of Expo Go)
    const isLikelyExpoGo =
      Platform.OS !== "web" &&
      typeof navigator !== "undefined" &&
      navigator.product === "ReactNative" &&
      typeof window === "undefined";

    if (isExpoGo || isLikelyExpoGo) {
      console.log(
        "Detected Expo Go environment - using mock Firebase implementation"
      );
      return setupMockFirebase();
    }

    // Initialize Firebase app
    firebaseApp = initializeApp(configToUse);

    // Initialize Firebase Auth with better error handling
    try {
      // Set a shorter timeout to fail fast
      const authInitPromise = new Promise((resolve, reject) => {
        try {
          if (firebaseApp) {
            firebaseAuth = getAuth(firebaseApp);

            // Quick check if auth is functional
            if (
              firebaseAuth &&
              typeof firebaseAuth.currentUser !== "undefined"
            ) {
              resolve(firebaseAuth);
            } else {
              reject(new Error("Auth instance not functional"));
            }
          } else {
            reject(new Error("Firebase app not initialized"));
          }
        } catch (error) {
          reject(error);
        }
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Auth timeout")), 1500);
      });

      await Promise.race([authInitPromise, timeoutPromise]);
      console.log("Firebase Auth initialized successfully");
    } catch (authError) {
      console.warn("Firebase Auth not available in this environment");
      console.log("Using mock Firebase implementation");
      return setupMockFirebase();
    }

    // Initialize Firestore
    try {
      firebaseFirestore = getFirestore(firebaseApp);
    } catch (firestoreError) {
      console.warn(
        "Firestore initialization failed, using mock:",
        firestoreError
      );
    }

    // Initialize Storage
    try {
      firebaseStorage = getStorage(firebaseApp);
    } catch (storageError) {
      console.warn("Storage initialization failed:", storageError);
    }

    console.log("Firebase initialized successfully");

    return {
      app: firebaseApp,
      auth: firebaseAuth,
      firestore: firebaseFirestore,
      storage: firebaseStorage,
    };
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    console.warn(
      "Development mode: Falling back to mock Firebase implementation"
    );
    return setupMockFirebase();
  }
};

// Firebase Authentication Functions
export const signInWithEmailAndPassword = async (
  email: string,
  password: string
) => {
  if (!firebaseAuth) throw new Error("Firebase Auth not initialized");

  try {
    const userCredential = await firebaseSignIn(firebaseAuth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

export const createUserWithEmailAndPassword = async (
  email: string,
  password: string
) => {
  if (!firebaseAuth) throw new Error("Firebase Auth not initialized");

  try {
    const userCredential = await firebaseCreateUser(
      firebaseAuth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const signOut = async () => {
  if (!firebaseAuth) throw new Error("Firebase Auth not initialized");

  try {
    await firebaseSignOut(firebaseAuth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Firestore Functions
export const addDocument = async (collectionName: string, data: any) => {
  if (!firebaseFirestore) throw new Error("Firestore not initialized");

  try {
    const docRef = await addDoc(
      collection(firebaseFirestore, collectionName),
      data
    );
    return docRef.id;
  } catch (error) {
    console.error("Error adding document:", error);
    throw error;
  }
};

export const getDocument = async (collectionName: string, id: string) => {
  if (!firebaseFirestore) throw new Error("Firestore not initialized");

  try {
    const docRef = doc(firebaseFirestore, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

export const updateDocument = async (
  collectionName: string,
  id: string,
  data: any
) => {
  if (!firebaseFirestore) throw new Error("Firestore not initialized");

  try {
    const docRef = doc(firebaseFirestore, collectionName, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, id: string) => {
  if (!firebaseFirestore) throw new Error("Firestore not initialized");

  try {
    const docRef = doc(firebaseFirestore, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

// Storage Functions
export const uploadFile = async (
  path: string,
  file: Blob | Uint8Array | ArrayBuffer
) => {
  if (!firebaseStorage) throw new Error("Firebase Storage not initialized");

  try {
    const storageRef = ref(firebaseStorage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Helper function to convert React Native image URI to Blob
export const uriToBlob = async (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function () {
      reject(new Error("uriToBlob failed"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
};

// Export Firebase instances for use in other modules
export const getFirebaseApp = () => firebaseApp;
export const getFirebaseAuth = () => firebaseAuth;
export const getFirebaseFirestore = () => firebaseFirestore;
export const getFirebaseStorage = () => firebaseStorage;

// Export a guide for setting up Firebase
export const getFirebaseSetupGuide = () => {
  return `
# Firebase Setup Guide

## Step 1: Create a Firebase Project
1. Go to the Firebase Console (https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Give your project a name (e.g., "Budget Tracker")
4. Enable Google Analytics if desired
5. Click "Create project"

## Step 2: Register Your App
1. In the Firebase console, click the "Web" icon (</>) to add a web app
2. Give your app a nickname (e.g., "Budget Tracker Web")
3. Check "Also set up Firebase Hosting" if desired
4. Click "Register app"
5. Copy the Firebase configuration object

## Step 3: Add Configuration to Your App
1. Create a file named 'firebase-config.ts' in the root of your project
2. Add the following code with your Firebase configuration:

\`\`\`typescript
// firebase-config.ts
export default {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional
};
\`\`\`

## Step 4: Initialize Firebase in Your App
1. In your app's entry point (e.g., app/_layout.tsx), import and initialize Firebase:

\`\`\`typescript
import { useEffect } from 'react';
import { initializeFirebase } from '../lib/firebase';
import firebaseConfig from '../firebase-config';

export default function RootLayout() {
  useEffect(() => {
    const initFirebase = async () => {
      try {
        await initializeFirebase(firebaseConfig);
        console.log('Firebase initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
      }
    };
    
    initFirebase();
  }, []);
  
  // Rest of your component
}
\`\`\`

## Step 5: Enable Authentication Methods
1. In the Firebase console, go to "Authentication" > "Sign-in method"
2. Enable Email/Password authentication
3. Optionally enable other authentication methods (Google, Apple, etc.)

## Step 6: Set Up Firestore Database
1. In the Firebase console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" or "Start in test mode"
4. Select a location for your database
5. Click "Enable"

## Step 7: Set Up Storage
1. In the Firebase console, go to "Storage"
2. Click "Get started"
3. Review and accept the default security rules
4. Click "Next" and "Done"

## Step 8: Install Firebase SDK
Run the following command to install Firebase:

\`\`\`
npm install firebase
\`\`\`

Now your app is ready to use Firebase for authentication, database, and storage!
`;
};
