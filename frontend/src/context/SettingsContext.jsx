import { createContext, useContext, useEffect, useState, useCallback } from "react";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  // Default settings (in case backend isn't running yet)
  const [settings, setSettings] = useState({
    platform: {
      maintenance: false,
      allowSignups: true,
      allowPostings: true,
      allowApplications: true,
      allowChats: true,
    },
    notifications: {
      emailAlerts: true,
      pushAlerts: true,
      inAppAlerts: true,
      autoCleanup: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 1. Fetch settings from backend on app load
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/settings");
      const data = await res.json();
      // Only update if we get valid data from backend
      if (data && data.platform && data.notifications) {
        setSettings(data);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Failed to fetch settings. Using defaults.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on initial load
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ✅ 2. Update settings globally (Called from Admin Settings page)
  const updateSettings = useCallback((newSettings) => {
    // Optimistically update the local state immediately
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      platform: { ...prev.platform, ...newSettings.platform },
      notifications: { ...prev.notifications, ...newSettings.notifications },
    }));
  }, []);

  // ✅ 3. Save settings to backend (PERSISTENT)
  const saveSettings = useCallback(async (newSettings) => {
    try {
      const token = await import("../firebase").then(m => m.auth.currentUser.getIdToken());
      const res = await fetch("http://localhost:5000/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      // Update local state immediately (real-time sync)
      updateSettings(newSettings);
      return true;
    } catch (err) {
      console.error("Error saving settings:", err);
      return false;
    }
  }, [updateSettings]);

  // ✅ 4. Reset settings to default (for troubleshooting)
  const resetSettings = useCallback(() => {
    setSettings({
      platform: {
        maintenance: false,
        allowSignups: true,
        allowPostings: true,
        allowApplications: true,
        allowChats: true,
      },
      notifications: { emailAlerts: true, pushAlerts: true, inAppAlerts: true, autoCleanup: false },
    });
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        fetchSettings,
        updateSettings,
        saveSettings,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};