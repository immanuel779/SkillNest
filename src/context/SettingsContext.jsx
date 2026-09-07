import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const SettingsContext = createContext();
export const useSettings = () => useContext(SettingsContext);

// Define defaults outside so we can merge them safely
const DEFAULT_SETTINGS = {
  platform: {
    maintenance: false,
    allowSignups: true,
    allowPostings: true,
    allowApplications: true,
    allowChats: true,
  },
  notifications: { emailAlerts: true, pushAlerts: true, inAppAlerts: true, autoCleanup: false },
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔥 FIXED: Using Firestore directly
  const settingsRef = doc(db, "settings", "platform");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        const fetchedData = docSnap.data();
        // 🛡️ CRITICAL FIX: Always merge fetched data with defaults.
        // This prevents "Cannot read properties of undefined" if the document is missing fields.
        const mergedSettings = {
          platform: { ...DEFAULT_SETTINGS.platform, ...(fetchedData.platform || {}) },
          notifications: { ...DEFAULT_SETTINGS.notifications, ...(fetchedData.notifications || {}) },
        };
        setSettings(mergedSettings);
      } else {
        console.log("No settings document found, using defaults.");
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Failed to fetch settings.");
      // Keep defaults on error so app doesn't crash
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({
      platform: { ...prev.platform, ...newSettings.platform },
      notifications: { ...prev.notifications, ...newSettings.notifications },
    }));
  }, []);

  const saveSettings = useCallback(async (newSettings) => {
    try {
      if (!auth.currentUser) {
        throw new Error("You must be logged in to save settings.");
      }
      await setDoc(settingsRef, newSettings, { merge: true });
      updateSettings(newSettings);
      return true;
    } catch (err) {
      console.error("Error saving settings:", err);
      return false;
    }
  }, [updateSettings]);

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    if (auth.currentUser) {
      await setDoc(settingsRef, DEFAULT_SETTINGS, { merge: true });
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, fetchSettings, updateSettings, saveSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};