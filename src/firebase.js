import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.REACT_APP_FIREBASE_PROJECT_ID ||
    "",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ||
    "",
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
