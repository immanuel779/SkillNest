import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const SettingsContext = createContext();
export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    platform: {
      maintenance: false,
      allowSignups: true,
      allowPostings: true,
      allowApplications: true,
      allowChats: true,
    },
    notifications: { emailAlerts: true, pushAlerts: true, inAppAlerts: true, autoCleanup: false },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔥 FIXED: Removed Render URL, using Firestore directly instead!
  const settingsRef = doc(db, "settings", "platform");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Reads directly from Firestore (Never sleeps, instant, free!)
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        // If no settings doc exists yet, keep the defaults
        console.log("No settings document found, using defaults.");
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Failed to fetch settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
      platform: { ...prev.platform, ...newSettings.platform },
      notifications: { ...prev.notifications, ...newSettings.notifications },
    }));
  }, []);

  const saveSettings = useCallback(async (newSettings) => {
    try {
      // ✅ Security: Only an authenticated user can save settings
      if (!auth.currentUser) {
        throw new Error("You must be logged in to save settings.");
      }

      // Saves directly to Firestore
      await setDoc(settingsRef, newSettings, { merge: true });

      updateSettings(newSettings);
      return true;
    } catch (err) {
      console.error("Error saving settings:", err);
      return false;
    }
  }, [updateSettings]);

  const resetSettings = useCallback(async () => {
    const defaultSettings = {
      platform: { maintenance: false, allowSignups: true, allowPostings: true, allowApplications: true, allowChats: true },
      notifications: { emailAlerts: true, pushAlerts: true, inAppAlerts: true, autoCleanup: false },
    };
    
    setSettings(defaultSettings);
    
    // Also reset it in Firestore if logged in
    if (auth.currentUser) {
      await setDoc(settingsRef, defaultSettings, { merge: true });
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, fetchSettings, updateSettings, saveSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};