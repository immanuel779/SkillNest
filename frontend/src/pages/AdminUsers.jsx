import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import AppLayout from "../components/AppLayout";
import { 
  FaUsers, FaSearch, FaEye, FaExchangeAlt, FaEnvelope, FaBan, FaTrash, 
  FaUserShield, FaBriefcase, FaUserTie, FaTimes, FaUserCheck, FaUserSlash, FaCheckCircle 
} from "react-icons/fa";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const userList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        userList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this user permanently?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setUsers(users.filter(u => u.id !== id));
      setMessage("✅ User deleted successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error deleting user."); }
  };

  const handleToggleRole = async (user) => {
    const newRole = user.role === "admin" ? "employee" : "admin";
    try {
      await updateDoc(doc(db, "users", user.id), { role: newRole });
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      setMessage(`✅ ${user.name}'s role changed to ${newRole}!`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error changing role."); }
  };

  const handleBanUnban = async (user) => {
    const newBlocked = !user.blocked;
    try {
      await updateDoc(doc(db, "users", user.id), { blocked: newBlocked });
      setUsers(users.map(u => u.id === user.id ? { ...u, blocked: newBlocked } : u));
      setMessage(newBlocked ? "🔒 User banned!" : "🔓 User unbanned!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error updating user."); }
  };

  const handleResetPassword = async (email) => {
    if (!confirm(`Send password reset email to ${email}?`)) return;
    try {
      await sendPasswordResetEmail(getAuth(), email);
      setMessage("📧 Password reset email sent!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error sending reset email."); }
  };

  const filtered = users.filter(u => {
    const matchesSearch = (u.name || "").toLowerCase().includes(search.toLowerCase()) || 
                          (u.email || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = roleFilter === "all" || 
      (roleFilter === "admin" && u.role === "admin") ||
      (roleFilter === "employer" && u.role === "employer") ||
      (roleFilter === "employee" && u.role === "employee") ||
      (roleFilter === "banned" && u.blocked);

    return matchesSearch && matchesRole;
  });

  const totalCount = users.length;
  const adminCount = users.filter(u => u.role === "admin").length;
  const employerCount = users.filter(u => u.role === "employer").length;
  const employeeCount = users.filter(u => u.role === "employee").length;
  const bannedCount = users.filter(u => u.blocked).length;

  if (loading) return <div className="admin-loader"><div className="loader-spinner"></div><p>Loading Users...</p></div>;

  return (
    <AppLayout>
      <div className="admin-header">
        <h1>User Management</h1>
        <span className="admin-badge"><FaUsers style={{ marginRight: 5 }} /> {totalCount}</span>
      </div>

      {message && <div className="success-alert">{message}</div>}

      <div className="status-summary">
        <div className="status-card" onClick={() => setRoleFilter("all")} style={{ cursor: 'pointer' }}>
          <div className="status-card-icon">📊</div>
          <div className="status-card-info"><strong>All Users</strong><span>{totalCount}</span></div>
        </div>
        <div className="status-card" onClick={() => setRoleFilter("admin")} style={{ cursor: 'pointer' }}>
          <div className="status-card-icon" style={{ color: "#ff8c00" }}><FaUserShield /></div>
          <div className="status-card-info"><strong>Admins</strong><span>{adminCount}</span></div>
        </div>
        <div className="status-card" onClick={() => setRoleFilter("employer")} style={{ cursor: 'pointer' }}>
          <div className="status-card-icon" style={{ color: "#00ff88" }}><FaBriefcase /></div>
          <div className="status-card-info"><strong>Employers</strong><span>{employerCount}</span></div>
        </div>
        <div className="status-card" onClick={() => setRoleFilter("employee")} style={{ cursor: 'pointer' }}>
          <div className="status-card-icon" style={{ color: "#00bfff" }}><FaUserTie /></div>
          <div className="status-card-info"><strong>Employees</strong><span>{employeeCount}</span></div>
        </div>
        <div className="status-card" onClick={() => setRoleFilter("banned")} style={{ cursor: 'pointer' }}>
          <div className="status-card-icon" style={{ color: "#ff4444" }}><FaBan /></div>
          <div className="status-card-info"><strong>Banned</strong><span>{bannedCount}</span></div>
        </div>
      </div>

      <div className="search-wrapper">
        <span className="search-icon"><FaSearch /></span>
        <input className="input-field" placeholder="Search users by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>
            <FaTimes />
          </button>
        )}
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Location</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px", opacity: 0.7 }}>No users found.</td></tr>
            ) : (
              filtered.map(user => (
                <tr key={user.id}>
                  <td data-label="Name">{user.name || "N/A"}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Role"><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                  <td data-label="Location">{user.location || "N/A"}</td>
                  <td data-label="Status">
                    {user.blocked ? <span className="status-badge closed"><FaBan /> Banned</span> : <span className="status-badge"><FaCheckCircle /> Active</span>}
                  </td>
                  <td data-label="Actions">
                    <div className="bug-actions">
                      <button className="btn-sm" onClick={() => setSelectedUser(user)}><FaEye /> View</button>
                      <button className="btn-sm" onClick={() => handleToggleRole(user)}><FaExchangeAlt /> Role</button>
                      <button className="btn-sm" onClick={() => handleResetPassword(user.email)}><FaEnvelope /> Reset</button>
                      <button className="btn-danger" onClick={() => handleBanUnban(user)}>{user.blocked ? <FaUserCheck /> : <FaUserSlash />}</button>
                      <button className="btn-danger" onClick={() => handleDelete(user.id)}><FaTrash /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaUserShield style={{ marginRight: '10px', color: '#ff8c00' }} />{selectedUser.name || "User"}</h3>
              <button className="btn-sm" onClick={() => setSelectedUser(null)}>Close</button>
            </div>
            
            <div className="user-detail-row"><strong>Email:</strong> {selectedUser.email}</div>
            <div className="user-detail-row"><strong>Role:</strong> <span className={`role-badge ${selectedUser.role}`}>{selectedUser.role}</span></div>
            {selectedUser.location && <div className="user-detail-row"><strong>Location:</strong> 📍 {selectedUser.location}</div>}
            {selectedUser.jobTitle && <div className="user-detail-row"><strong>Job Title:</strong> {selectedUser.jobTitle}</div>}
            {selectedUser.organizationName && <div className="user-detail-row"><strong>Organization:</strong> 🏢 {selectedUser.organizationName}</div>}
            {selectedUser.bio && <div className="user-detail-row"><strong>Bio:</strong> {selectedUser.bio}</div>}
            {selectedUser.skills && selectedUser.skills.length > 0 && (
              <div className="user-detail-row">
                <strong>Skills:</strong>
                <div className="user-skill-tags">
                  {selectedUser.skills.map((skill, idx) => <span key={idx} className="skill-tag">{skill}</span>)}
                </div>
              </div>
            )}
            {selectedUser.cvUrl && <div className="user-detail-row"><strong>CV:</strong> <a href={selectedUser.cvUrl} target="_blank" rel="noopener noreferrer" className="cv-view-link">📄 View CV</a></div>}
            {selectedUser.createdAt?.seconds && <div className="user-detail-row"><strong>Joined:</strong> {new Date(selectedUser.createdAt.seconds * 1000).toLocaleString()}</div>}
            <div className="user-detail-row" style={{ marginTop: '20px' }}><button className="btn-primary" onClick={() => setSelectedUser(null)}>Close</button></div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminUsers;