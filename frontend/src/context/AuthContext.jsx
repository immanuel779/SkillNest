import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // 🔥 NEW: Stores Firestore User Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the user's Firestore Profile when they log in
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (uid) => {
      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && isMounted) {
          setUserProfile(docSnap.data());
        } else if (isMounted) {
          setUserProfile(null); // No profile found
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        if (isMounted) setUserProfile(null);
      }
    };

    const unsubscribe = onAuthStateChanged(
      auth,
      (authUser) => {
        if (isMounted) {
          setUser(authUser);
          setError(null);
          setLoading(false);
          if (authUser) {
            fetchProfile(authUser.uid); // Fetch profile immediately
          } else {
            setUserProfile(null); // Clear profile on logout
          }
        }
      },
      (authError) => {
        if (isMounted) {
          console.error("Auth state change error:", authError);
          setError(authError.message);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // ✅ Centralized Logout Function
  const logout = async () => {
    await signOut(auth);
  };

  // ✅ Derived States (Instantly accessible everywhere)
  const userRole = userProfile?.role || null;
  const isAdmin = userRole === "admin";

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    userProfile,
    userRole,
    isAdmin,
    loading,
    error,
    logout,
  }), [user, userProfile, userRole, isAdmin, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};