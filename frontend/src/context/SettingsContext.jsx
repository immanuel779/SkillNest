import { createContext, useContext, useEffect, useState, useCallback } from "react";

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

  // ✅ LIVE BACKEND URL (NO localhost!)
  const BACKEND_URL = "https://skillnest-88fd.onrender.com";

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings`);
      const data = await res.json();
      if (data && data.platform && data.notifications) {
        setSettings(data);
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
      const token = await import("../firebase").then((m) => m.auth.currentUser.getIdToken());
      const res = await fetch(`${BACKEND_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      updateSettings(newSettings);
      return true;
    } catch (err) {
      console.error("Error saving settings:", err);
      return false;
    }
  }, [updateSettings]);

  const resetSettings = useCallback(() => {
    setSettings({
      platform: { maintenance: false, allowSignups: true, allowPostings: true, allowApplications: true, allowChats: true },
      notifications: { emailAlerts: true, pushAlerts: true, inAppAlerts: true, autoCleanup: false },
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, fetchSettings, updateSettings, saveSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};