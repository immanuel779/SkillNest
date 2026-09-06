import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// This function lets us add a notification to any user
export const addNotification = async (recipientId, title, message, type) => {
  if (!recipientId) return;
  try {
    await addDoc(collection(db, "notifications"), {
      recipientId,
      title,
      message,
      type, // 'welcome', 'job', 'application', 'message', 'security', 'update'
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding notification:", error);
  }
};