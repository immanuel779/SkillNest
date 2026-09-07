import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import AppLayout from "../components/AppLayout";
import { FaSearch, FaCheck, FaSpinner, FaClock, FaTrash, FaBug, FaUser, FaEnvelope, FaLink, FaImage } from "react-icons/fa";

const AdminBugReports = () => {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchBugs = async () => {
      try {
        const snapshot = await getDocs(collection(db, "bug_reports"));
        const bugList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        bugList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setBugs(bugList);
      } catch (error) {
        console.error("Error fetching bugs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBugs();
  }, []);

  const handleStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "bug_reports", id), { status });
      setBugs(bugs.map(b => b.id === id ? { ...b, status } : b));
      setMessage(`✅ Bug marked as ${status}!`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error updating status."); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this bug report permanently?")) return;
    try {
      await deleteDoc(doc(db, "bug_reports", id));
      setBugs(bugs.filter(b => b.id !== id));
      setMessage("✅ Bug report deleted!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error deleting bug report."); }
  };

  const filteredBugs = bugs.filter(bug => {
    const matchesSearch = (bug.userName || "").toLowerCase().includes(search.toLowerCase()) || 
                          (bug.userEmail || "").toLowerCase().includes(search.toLowerCase()) ||
                          (bug.description || "").toLowerCase().includes(search.toLowerCase()) ||
                          (bug.pageUrl || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || bug.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = bugs.filter(b => b.status === "open" || b.status === "pending").length;
  const inProgressCount = bugs.filter(b => b.status === "in-progress").length;
  const resolvedCount = bugs.filter(b => b.status === "resolved").length;
  const totalCount = bugs.length;

  if (loading) return <div className="admin-loader"><div className="loader-spinner"></div><p>Loading Bug Reports...</p></div>;

  return (
    <AppLayout>
      <div className="admin-header">
        <h1>Bug Reports</h1>
        <span className="admin-badge"><FaBug style={{ marginRight: 5 }} /> {totalCount}</span>
      </div>

      {message && <div className="success-alert">{message}</div>}

      <div className="status-summary">
        <div className="status-card" onClick={() => setStatusFilter("all")}>
          <div className="status-card-icon">📊</div>
          <div className="status-card-info"><strong>All</strong><span>{totalCount}</span></div>
        </div>
        <div className="status-card" onClick={() => setStatusFilter("open")} style={{ cursor: 'pointer' }}>
          <div className="status-card-icon" style={{ color: "#ff8c00" }}>⏳</div>
          <div className="status-card-info"><strong>Open/Pending</strong><span>{openCount}</span></div>
        </div>
        <div className="status-card" onClick={() => setStatusFilter("in-progress")} style={{ cursor: 'pointer' }}>
          <div className="status-card-icon" style={{ color: "#00bfff" }}>🛠️</div>
          <div className="status-card-info"><strong>In Progress</strong><span>{inProgressCount}</span></div>
        </div>
        <div className="status-card" onClick={() => setStatusFilter("resolved")} style={{ cursor: 'pointer' }}>
          <div className="status-card-icon" style={{ color: "#00ff88" }}>✅</div>
          <div className="status-card-info"><strong>Resolved</strong><span>{resolvedCount}</span></div>
        </div>
      </div>

      <div className="search-wrapper">
        <span className="search-icon"><FaSearch /></span>
        <input className="input-field" placeholder="Search by name, email, description, or URL..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Bug Description</th><th>Screenshot</th><th>Page URL</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredBugs.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "20px", opacity: 0.7 }}>No bug reports found.</td></tr>
            ) : (
              filteredBugs.map(bug => (
                <tr key={bug.id}>
                  <td data-label="Name"><strong><FaUser style={{ marginRight: 5 }} /> {bug.userName || "Not logged in"}</strong></td>
                  <td data-label="Email"><FaEnvelope style={{ marginRight: 5 }} /> {bug.userEmail || "Not logged in"}</td>
                  <td data-label="Description" className="bug-description"><p>{bug.description}</p></td>
                  <td data-label="Screenshot">
                    {bug.imageUrl ? (
                      <img src={bug.imageUrl} alt="Bug Screenshot" className="admin-bug-thumbnail" onClick={() => setSelectedImage(bug.imageUrl)} />
                    ) : (
                      <span style={{ opacity: 0.5 }}>No image</span>
                    )}
                  </td>
                  <td data-label="Page URL"><a href={bug.pageUrl} target="_blank" rel="noopener noreferrer" className="bug-page-url"><FaLink style={{ marginRight: 5 }} />{bug.pageUrl}</a></td>
                  <td data-label="Status"><span className={`status-badge ${bug.status === "resolved" ? "approved" : bug.status === "in-progress" ? "pending" : "closed"}`}>{bug.status || "open"}</span></td>
                  <td data-label="Actions">
                    <div className="bug-actions">
                      <button className="btn-sm" onClick={() => handleStatus(bug.id, "resolved")}><FaCheck /> Resolved</button>
                      <button className="btn-sm" onClick={() => handleStatus(bug.id, "in-progress")}><FaSpinner /> Progress</button>
                      <button className="btn-sm" onClick={() => handleStatus(bug.id, "pending")}><FaClock /> Pending</button>
                      <button className="btn-danger" onClick={() => handleDelete(bug.id)}><FaTrash /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedImage && (
        <div className="image-viewer-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Full Screenshot" className="full-image-view" />
            <button className="btn btn-primary" onClick={() => setSelectedImage(null)}>Close</button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminBugReports;