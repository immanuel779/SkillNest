import { createContext, useContext, useEffect, useState } from "react";
import { messaging, db, VAPID_KEY } from "../firebase";
import { getToken, onMessage, isSupported } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";

const PushContext = createContext();
export const usePush = () => useContext(PushContext);

export const PushProvider = ({ children }) => {
  const { user } = useAuth();
  const [permission, setPermission] = useState("default");
  const [token, setToken] = useState(null);
  const [foregroundMessage, setForegroundMessage] = useState(null);

  useEffect(() => {
    // ✅ Guard: Do not run if user is logged out or messaging is null/unsupported
    if (!user || !messaging) return;

    const init = async () => {
      try {
        // ✅ Guard: Check if browser actually supports push notifications
        const supported = await isSupported();
        if (!supported) {
          console.warn("Push notifications are not supported on this browser.");
          return;
        }

        // Request permission
        const p = await Notification.requestPermission();
        setPermission(p);

        if (p === "granted") {
          // Get token & save to database
          const t = await getToken(messaging, { vapidKey: VAPID_KEY });
          setToken(t);
          if (t) await setDoc(doc(db, "users", user.uid), { fcmToken: t }, { merge: true });

          // Listen for foreground messages (when app is open)
          onMessage(messaging, (payload) => {
            // ✅ Save the notification so you can show a toast/alert in the UI
            setForegroundMessage(payload.notification);
            // Auto-clear after 5 seconds
            setTimeout(() => setForegroundMessage(null), 5000);
          });
        }
      } catch (err) {
        console.error("Push Notification Error:", err);
        // Ensure we don't crash if permission is denied or blocked
      }
    };

    init();
  }, [user]);

  return (
    <PushContext.Provider value={{ permission, token, foregroundMessage }}>
      {children}
    </PushContext.Provider>
  );
};