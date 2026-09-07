import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import AppLayout from "../components/AppLayout";
import { FaBullhorn, FaTrash, FaHistory, FaSearch, FaPaperPlane, FaEnvelope, FaUsers, FaBriefcase, FaUser, FaShieldAlt, FaTag, FaTimes } from "react-icons/fa";

const AdminNotifications = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [type, setType] = useState("update");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersSnap, notifSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "notifications"))
        ]);

        setAllUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const fetchedNotifs = notifSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        fetchedNotifs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setNotifications(fetchedNotifs);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getUserName = (id) => {
    const user = allUsers.find(u => u.id === id);
    return user ? (user.name || user.email || "User") : "Unknown User";
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    setSuccess(null);
    try {
      let recipients = [];

      if (selectedUser === "all") recipients = allUsers;
      else if (selectedUser === "role-employer") recipients = allUsers.filter(u => u.role === "employer");
      else if (selectedUser === "role-employee") recipients = allUsers.filter(u => u.role === "employee");
      else if (selectedUser === "role-admin") recipients = allUsers.filter(u => u.role === "admin");
      else {
        const specificUser = allUsers.find(u => u.id === selectedUser);
        if (specificUser) recipients = [specificUser];
      }

      if (recipients.length === 0) {
        setSuccess("❌ No users found for this selection.");
        setTimeout(() => setSuccess(null), 3000);
        setSending(false);
        return;
      }

      const notificationPromises = recipients.map(user =>
        addDoc(collection(db, "notifications"), {
          recipientId: user.id,
          recipientRole: user.role || "unknown",
          title,
          message,
          type,
          read: false,
          createdAt: serverTimestamp()
        })
      );
      await Promise.all(notificationPromises);
      setSuccess(`✅ Notification sent to ${recipients.length} users!`);

      setTitle("");
      setMessage("");
      setSelectedUser("all");
      setType("update");

      const notifSnap = await getDocs(collection(db, "notifications"));
      const fetchedNotifs = notifSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedNotifs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(fetchedNotifs);

    } catch (error) {
      alert("Error sending notification.");
      console.error(error);
    } finally {
      setSending(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!confirm("Delete this notification permanently?")) return;
    try {
      await deleteDoc(doc(db, "notifications", id));
      setNotifications(notifications.filter(n => n.id !== id));
      setSuccess("✅ Notification deleted!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) { alert("Error deleting notification."); }
  };

  const handleClearAll = async () => {
    if (!confirm("Delete ALL notifications? This cannot be undone.")) return;
    try {
      await Promise.all(notifications.map(n => deleteDoc(doc(db, "notifications", n.id))));
      setNotifications([]);
      setSuccess("✅ All notifications cleared!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) { alert("Error clearing notifications."); }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = (n.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (n.message || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || n.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) return <div className="admin-loader"><div className="loader-spinner"></div><p>Loading...</p></div>;

  return (
    <AppLayout>
      <div className="admin-header">
        <h1>Notification Center</h1>
        <span className="admin-badge"><FaBullhorn style={{ marginRight: 5 }} /> {notifications.length}</span>
      </div>

      {success && <div className="success-alert">{success}</div>}

      <div className="chart-card" style={{ marginBottom: "20px" }}>
        <h3><FaPaperPlane style={{ marginRight: '8px', color: '#ff8c00' }} />Send New Notification</h3>
        <form onSubmit={handleSend}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label"><FaUsers style={{ marginRight: 5 }} /> Send To</label>
              <select className="input-field" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                <option value="all">📢 All Users</option>
                <option value="role-employer">🏢 All Employers</option>
                <option value="role-employee">💼 All Employees</option>
                <option value="role-admin">🛡️ All Admins</option>
                <optgroup label="Specific Users">
                  {allUsers.map(user => <option key={user.id} value={user.id}>👤 {user.name || user.email}</option>)}
                </optgroup>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label"><FaTag style={{ marginRight: 5 }} /> Notification Type</label>
              <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="update">🚀 App Update</option>
                <option value="job">💼 Job Alert</option>
                <option value="security">🔒 Security</option>
                <option value="message">💬 Message</option>
                <option value="welcome">👋 Welcome</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label"><FaBullhorn style={{ marginRight: 5 }} /> Title</label>
            <input className="input-field" type="text" placeholder="e.g. New Feature Released!" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label"><FaEnvelope style={{ marginRight: 5 }} /> Message</label>
            <textarea className="input-field textarea-field" placeholder="Write your notification message..." value={message} onChange={(e) => setMessage(e.target.value)} rows="4" required></textarea>
          </div>
          <button className="btn btn-primary" type="submit" disabled={sending}>
            {sending ? "Sending..." : <><FaPaperPlane /> Send Notification</>}
          </button>
        </form>
      </div>

      <div className="chart-card">
        <div className="admin-header" style={{ marginBottom: "10px" }}>
          <h3><FaHistory style={{ marginRight: '8px', color: '#ff8c00' }} />Notification History</h3>
          <button className="btn-sm" style={{ background: "rgba(255,0,0,0.2)", border: "1px solid #ff4444" }} onClick={handleClearAll}><FaTrash /> Clear All</button>
        </div>

        <div className="search-wrapper" style={{ marginBottom: '15px' }}>
          <span className="search-icon"><FaSearch /></span>
          <input className="input-field" placeholder="Search notification history..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && <button onClick={() => setSearchTerm("")} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}><FaTimes /></button>}
        </div>

        <div className="form-group">
          <select className="input-field" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ maxWidth: "250px" }}>
            <option value="all">Filter by Type (All)</option>
            <option value="update">App Update</option>
            <option value="job">Job Alert</option>
            <option value="security">Security</option>
            <option value="message">Message</option>
            <option value="welcome">Welcome</option>
          </select>
        </div>

        {filteredNotifications.length === 0 ? (
          <p>No notifications sent yet.</p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr><th>Title & Message</th><th>Type</th><th>Recipient</th><th>Time</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredNotifications.slice(0, 30).map(notif => (
                  <tr key={notif.id}>
                    <td data-label="Message"><strong>{notif.title}</strong><p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#ccc' }}>{notif.message}</p></td>
                    <td data-label="Type"><span className={`status-badge ${notif.type === "job" ? "pending" : notif.type === "security" ? "closed" : "approved"}`}>{notif.type || "update"}</span></td>
                    <td data-label="Recipient">{getUserName(notif.recipientId)}</td>
                    <td data-label="Time">{notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : "Just now"}</td>
                    <td data-label="Actions"><button className="btn-danger" onClick={() => handleDeleteNotification(notif.id)}><FaTrash /> Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminNotifications;