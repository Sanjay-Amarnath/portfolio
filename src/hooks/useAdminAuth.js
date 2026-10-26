"use client";

import { useState, useEffect, useCallback } from "react";
import { getFirebaseServices } from "@/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

const ADMIN_EMAIL = "sanjaymrnth@gmail.com";

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let unsubscribe;
    try {
      const { auth } = getFirebaseServices();
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          const isAdminUser = currentUser.email === ADMIN_EMAIL;
          setIsAdmin(isAdminUser);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      });
    } catch (err) {
      console.warn("Firebase not configured:", err.message);
      setLoading(false);
    }
    return () => unsubscribe?.();
  }, []);

  const login = useCallback(async (email, password) => {
    const { auth } = getFirebaseServices();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (cred.user.email !== ADMIN_EMAIL) {
      await signOut(auth);
      throw new Error("Unauthorized");
    }
    return cred.user;
  }, []);

  const logout = useCallback(async () => {
    const { auth } = getFirebaseServices();
    await signOut(auth);
  }, []);

  return { isAdmin, loading, user, login, logout };
}