import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
};

export const ADMIN_EMAIL = "sanjaymrnth@gmail.com";
export const MAX_RESUME_SIZE = 4 * 1024 * 1024;
export const MAX_PROFILE_IMAGE_SIZE = 4 * 1024 * 1024;

export const isFirebaseConfigured = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every(Boolean);

export function getFirebaseServices() {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firebase is not configured. Add the required REACT_APP_FIREBASE_* environment variables.",
    );
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return { auth: getAuth(app) };
}
