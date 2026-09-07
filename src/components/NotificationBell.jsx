import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { FaBell, FaCheckDouble, FaTrashAlt } from "react-icons/fa";

const NotificationBell = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch using getDocs (NO INDEX ERRORS - NO startTime CRASH!)
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "notifications"), where("recipientId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const notifs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      // Sort locally (NEWEST FIRST)
      notifs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try { await updateDoc(doc(db, "notifications", id), { read: true }); } catch (e) {}
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      const unreadDocs = notifications.filter((n) => !n.read);
      await Promise.all(unreadDocs.map((n) => updateDoc(doc(db, "notifications", n.id), { read: true })));
    } catch (e) {}
  };

  const clearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try { await Promise.all(notifications.map((n) => deleteDoc(doc(db, "notifications", n.id)))); } catch (e) {}
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
              <span onClick={markAllRead} className="mark-read"><FaCheckDouble /> Mark all read</span>
              <span onClick={clearAll} className="clear-all"><FaTrashAlt /> Clear all</span>
            </div>
          </div>
          <div className="notification-list">
            {notifications.length === 0 && <p style={{ padding: "20px", textAlign: "center", opacity: 0.7 }}>No notifications yet</p>}
            {notifications.map((n) => (
              <div key={n.id} className={`notification-item ${n.read ? "" : "unread"}`} onClick={() => markAsRead(n.id)}>
                <div className="notification-content">
                  <h5>{n.title}</h5>
                  <p>{n.message}</p>
                  <span className="notification-time">{n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleString() : "Just now"}</span>
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