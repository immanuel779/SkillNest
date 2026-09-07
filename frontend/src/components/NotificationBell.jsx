import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { 
  listenToNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearAllNotifications 
} from "../utils/notifications";
import { FaBell, FaCheckDouble, FaTrashAlt, FaTimes } from "react-icons/fa";

const NotificationBell = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ REAL-TIME LISTENER (Updates instantly, no intervals)
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = listenToNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Mark a single notification as read (with optimistic UI)
  const handleMarkAsRead = async (id) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Mark ALL as read
  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead(user.uid);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Clear ALL notifications
  const handleClearAll = async () => {
    if (!confirm("Clear ALL notifications? This cannot be undone.")) return;
    setNotifications([]);
    setUnreadCount(0);

    try {
      await clearAllNotifications(user.uid);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // Helper: Relative time
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "Just now";
    const seconds = Math.floor((Date.now() - timestamp.seconds * 1000) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="notification-wrapper">
      <button className="bell-btn" onClick={() => setIsOpen(!isOpen)}>
        <FaBell />
        {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h4>Notifications</h4>
            <div className="notification-actions">
              <span onClick={handleMarkAllRead} className="mark-read">
                <FaCheckDouble /> Mark all read
              </span>
              <span onClick={handleClearAll} className="clear-all">
                <FaTrashAlt /> Clear all
              </span>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {loading && <p style={{ padding: "20px", textAlign: "center", opacity: 0.7 }}>Loading notifications...</p>}
            
            {!loading && notifications.length === 0 && (
              <p style={{ padding: "20px", textAlign: "center", opacity: 0.7 }}>No notifications yet</p>
            )}

            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`notification-item ${n.read ? "" : "unread"}`} 
                onClick={() => handleMarkAsRead(n.id)}
              >
                <div className="notification-content">
                  <h5>{n.title}</h5>
                  <p>{n.message}</p>
                  <span className="notification-time">
                    {getRelativeTime(n.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;