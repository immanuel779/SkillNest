import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import AppLayout from "../components/AppLayout";
import { FaSearch, FaEye, FaCheck, FaTimes, FaTrash, FaFileAlt, FaUser } from "react-icons/fa";

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const [appsSnap, needsSnap] = await Promise.all([
          getDocs(collection(db, "applications")),
          getDocs(collection(db, "needs"))
        ]);

        const needsMap = {};
        needsSnap.docs.forEach(d => { needsMap[d.id] = d.data().title || "Unknown Job"; });

        const enriched = appsSnap.docs.map(appDoc => {
          const app = { id: appDoc.id, ...appDoc.data() };
          return {
            ...app,
            jobTitle: needsMap[app.needId] || "Unknown Job",
            applicantName: app.fullName || "Unknown User",
            applicantEmail: app.email || app.volunteerEmail || "Unknown Email"
          };
        });

        enriched.sort((a, b) => (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0));
        setApplications(enriched);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const handleStatus = async (appId, status) => {
    try {
      await updateDoc(doc(db, "applications", appId), { status });
      setApplications(apps => apps.map(a => a.id === appId ? { ...a, status } : a));
      setMessage(`✅ Application ${status}!`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error updating application."); }
  };

  const handleDelete = async (appId) => {
    if (!confirm("Delete this application permanently?")) return;
    try {
      await deleteDoc(doc(db, "applications", appId));
      setApplications(apps => apps.filter(a => a.id !== appId));
      setMessage("✅ Application deleted!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error deleting application."); }
  };

  const filtered = applications.filter(app =>
    (app.jobTitle || "").toLowerCase().includes(search.toLowerCase()) ||
    (app.applicantName || "").toLowerCase().includes(search.toLowerCase()) ||
    (app.applicantEmail || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="admin-loader"><div className="loader-spinner"></div><p>Loading Applications...</p></div>;

  return (
    <AppLayout>
      <div className="admin-header">
        <h1>Application Management</h1>
        <span className="admin-badge">📝 Total: {applications.length}</span>
      </div>

      {message && <div className="success-alert">{message}</div>}

      <div className="search-wrapper">
        <span className="search-icon"><FaSearch /></span>
        <input className="input-field" placeholder="Search by job title, applicant, or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr><th>Job Title</th><th>Applicant</th><th>Email</th><th>Experience</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px", opacity: 0.7 }}>No applications found.</td></tr>
            ) : (
              filtered.map(app => (
                <tr key={app.id}>
                  <td data-label="Job">{app.jobTitle}</td>
                  <td data-label="Applicant"><strong><FaUser style={{ marginRight: 5 }} /> {app.applicantName}</strong></td>
                  <td data-label="Email">{app.applicantEmail}</td>
                  <td data-label="Experience">{app.experience || "N/A"}</td>
                  <td data-label="Status"><span className={`status-badge ${app.status === "accepted" ? "approved" : app.status === "rejected" ? "closed" : "pending"}`}>{app.status || "pending"}</span></td>
                  <td data-label="Actions">
                    <div className="bug-actions">
                      <button className="btn-sm" onClick={() => setSelectedApp(app)}><FaEye /> View</button>
                      <button className="btn-sm" onClick={() => handleStatus(app.id, "accepted")}><FaCheck /> Accept</button>
                      <button className="btn-sm" onClick={() => handleStatus(app.id, "rejected")}><FaTimes /> Reject</button>
                      <button className="btn-danger" onClick={() => handleDelete(app.id)}><FaTrash /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📝 Application Details</h3>
            <p><strong>Job:</strong> {selectedApp.jobTitle}</p>
            <p><strong>Applicant:</strong> {selectedApp.applicantName}</p>
            <p><strong>Email:</strong> {selectedApp.applicantEmail}</p>
            <p><strong>Phone:</strong> {selectedApp.phone}</p>
            <p><strong>Location:</strong> {selectedApp.location}</p>
            <p><strong>Experience:</strong> {selectedApp.experience}</p>
            <p><strong>Cover Letter:</strong> {selectedApp.coverLetter}</p>
            {selectedApp.resumeUrl && <p><a href={selectedApp.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#ff8c00' }}>📄 View Resume</a></p>}
            <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setSelectedApp(null)}>Close</button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminApplications;