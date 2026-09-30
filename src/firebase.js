import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "",
};

export const ADMIN_EMAIL = "sanjaymrnth@gmail.com";
export const RESUME_STORAGE_PATH = "resumes/current.pdf";
export const MAX_RESUME_SIZE = 10 * 1024 * 1024;

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

export function getFirebaseServices() {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured. Add the required REACT_APP_FIREBASE_* environment variables.");
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return {
    auth: getAuth(app),
    storage: getStorage(app),
  };
}
