import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, doc, deleteDoc, getDocs } from "firebase/firestore";

// 1. Backend URL for sending Email & Push Notifications
const BACKEND_URL = "https://skillnest-88fd.onrender.com";

// =========================================
// FUNCTION 1: Add a basic in-app notification
// =========================================
export const addNotification = async (recipientId, title, message, type) => {
  if (!recipientId) return;
  try {
    await addDoc(collection(db, "notifications"), {
      recipientId, title, message, type, read: false, createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding notification:", error);
  }
};

// =========================================
// FUNCTION 2: Send Advanced Notification (In-app + Email + Push)
// =========================================
export const sendNotification = async (recipientId, title, message, type, recipientEmail = null) => {
  // 1. In-app notification
  await addNotification(recipientId, title, message, type);

  // 2. Email + Push via Backend (if available)
  try {
    const token = await auth.currentUser.getIdToken();
    await fetch(`${BACKEND_URL}/api/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ recipientId, title, message, type, email: recipientEmail }),
    });
  } catch (error) {
    console.warn("Backend notify endpoint not available, in-app only.");
  }
};

// =========================================
// FUNCTION 3: Broadcast to ALL users (Admin)
// =========================================
export const sendBroadcast = async (title, message, type = "update") => {
  const usersSnap = await getDocs(collection(db, "users"));
  const promises = usersSnap.docs.map(userDoc => {
    return addNotification(userDoc.id, title, message, type);
  });
  await Promise.all(promises);
};

// =========================================
// FUNCTION 4: Listen to real-time notifications (for Notification Bell)
// =========================================
export const listenToNotifications = (userId, callback) => {
  const q = query(collection(db, "notifications"), where("recipientId", "==", userId));
  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    notifs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(notifs);
  });
};

// =========================================
// FUNCTION 5: Mark a single notification as read
// =========================================
export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, "notifications", notificationId), { read: true });
  } catch (error) {
    console.error("Error marking as read:", error);
  }
};

// =========================================
// FUNCTION 6: Mark ALL notifications as read
// =========================================
export const markAllNotificationsAsRead = async (userId) => {
  const q = query(collection(db, "notifications"), where("recipientId", "==", userId), where("read", "==", false));
  const snap = await getDocs(q);
  const promises = snap.docs.map(d => updateDoc(d.ref, { read: true }));
  await Promise.all(promises);
};

// =========================================
// FUNCTION 7: Clear ALL notifications for a user
// =========================================
export const clearAllNotifications = async (userId) => {
  const q = query(collection(db, "notifications"), where("recipientId", "==", userId));
  const snap = await getDocs(q);
  const promises = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(promises);
};