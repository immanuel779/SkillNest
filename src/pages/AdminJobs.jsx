import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import AppLayout from "../components/AppLayout";
import { FaSearch, FaEye, FaStar, FaCheck, FaUndo, FaTrash, FaBriefcase, FaMapMarkerAlt, FaPhone, FaWhatsapp, FaTimes } from "react-icons/fa";

const AdminJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const snapshot = await getDocs(collection(db, "needs"));
        const jobsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        jobsList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setJobs(jobsList);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this job permanently?")) return;
    try {
      await deleteDoc(doc(db, "needs", id));
      setJobs(jobs.filter(j => j.id !== id));
      setMessage("✅ Job deleted successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error deleting job."); }
  };

  const handleFeature = async (job) => {
    const newFeatured = !job.featured;
    try {
      await updateDoc(doc(db, "needs", job.id), { featured: newFeatured });
      setJobs(jobs.map(j => j.id === job.id ? { ...j, featured: newFeatured } : j));
      setMessage(newFeatured ? "⭐ Job featured!" : "Job removed from featured.");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error updating job."); }
  };

  const handleMarkFilled = async (job) => {
    const newStatus = job.status === "filled" ? "open" : "filled";
    try {
      await updateDoc(doc(db, "needs", job.id), { status: newStatus });
      setJobs(jobs.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
      setMessage(newStatus === "filled" ? "✅ Job marked as filled!" : "Job reopened!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error updating job."); }
  };

  const filtered = jobs.filter(job => {
    const matchesSearch = (job.title || "").toLowerCase().includes(search.toLowerCase()) || 
                          (job.organizationName || "").toLowerCase().includes(search.toLowerCase()) ||
                          (job.location || "").toLowerCase().includes(search.toLowerCase()) ||
                          (job.skillRequired || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "open" && job.status !== "filled") ||
      (statusFilter === "filled" && job.status === "filled") ||
      (statusFilter === "featured" && job.featured);
    return matchesSearch && matchesStatus;
  });

  const openCount = jobs.filter(j => j.status !== "filled").length;
  const filledCount = jobs.filter(j => j.status === "filled").length;
  const featuredCount = jobs.filter(j => j.featured).length;

  if (loading) return <div className="admin-loader"><div className="loader-spinner"></div><p>Loading Jobs...</p></div>;

  return (
    <AppLayout>
      <div className="admin-header">
        <h1>Job Management</h1>
        <span className="admin-badge"><FaBriefcase style={{ marginRight: 5 }} /> {jobs.length}</span>
      </div>

      {message && <div className="success-alert">{message}</div>}

      {/* Status Filter Cards */}
      <div className="status-summary">
        <div className="status-card" onClick={() => setStatusFilter("all")} style={{ cursor: 'pointer' }}>
          <div className="status-card-icon">📊</div>
          <div className="status-card-info"><strong>All</strong><span>{jobs.length}</span></div>
        </div>
        <div className="status-card" onClick={() => setStatusFilter("open")} style={{ cursor: 'pointer' }}>
          <div className="status-card-icon" style={{ color: "#00ff88" }}>✅</div>
          <div className="status-card-info"><strong>Open</strong><span>{openCount}</span></div>
        </div>
        <div className="status-card" onClick={() => setStatusFilter("filled")} style={{ cursor: 'pointer' }}>
          <div className="status-card-icon" style={{ color: "#ff8c00" }}>📦</div>
          <div className="status-card-info"><strong>Filled</strong><span>{filledCount}</span></div>
        </div>
        <div className="status-card" onClick={() => setStatusFilter("featured")} style={{ cursor: 'pointer' }}>
          <div className="status-card-icon" style={{ color: "#ffcc00" }}>⭐</div>
          <div className="status-card-info"><strong>Featured</strong><span>{featuredCount}</span></div>
        </div>
      </div>

      <div className="search-wrapper">
        <span className="search-icon"><FaSearch /></span>
        <input className="input-field" placeholder="Search by title, org, location, or skill..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>
            <FaTimes />
          </button>
        )}
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Org</th><th>Location</th><th>Status</th><th>Featured</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px", opacity: 0.7 }}>No jobs found.</td></tr>
            ) : (
              filtered.map(job => (
                <tr key={job.id}>
                  <td data-label="Title">{job.title}</td>
                  <td data-label="Org">{job.organizationName}</td>
                  <td data-label="Location"><FaMapMarkerAlt style={{ marginRight: 5 }} />{job.location}</td>
                  <td data-label="Status"><span className={`status-badge ${job.status === "filled" ? "closed" : ""}`}>{job.status || "open"}</span></td>
                  <td data-label="Featured">{job.featured ? <FaStar style={{ color: "#ffcc00" }} /> : "—"}</td>
                  <td data-label="Actions">
                    <div className="bug-actions">
                      <button className="btn-sm" onClick={() => setSelectedJob(job)}><FaEye /> View</button>
                      <button className="btn-sm" onClick={() => handleFeature(job)}>{job.featured ? <FaUndo /> : <FaStar />}</button>
                      <button className="btn-sm" onClick={() => handleMarkFilled(job)}>{job.status === "filled" ? <FaUndo /> : <FaCheck />}</button>
                      <button className="btn-danger" onClick={() => handleDelete(job.id)}><FaTrash /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3><FaBriefcase style={{ marginRight: 10, color: '#ff8c00' }} />{selectedJob.title}</h3>
            <p><strong>Organization:</strong> {selectedJob.organizationName}</p>
            <p><strong>Location:</strong> <FaMapMarkerAlt style={{ marginRight: 5 }} />{selectedJob.location}</p>
            <p><strong>Skill Required:</strong> {selectedJob.skillRequired}</p>
            <p><strong>Description:</strong> {selectedJob.description}</p>
            <p><strong>Status:</strong> {selectedJob.status || "open"}</p>
            {selectedJob.featured && <p><strong>Featured:</strong> <FaStar style={{ color: '#ffcc00' }} /></p>}
            <div className="contact-details">
              <h4>Contact Information</h4>
              {selectedJob.whatsappNumber && <p><FaWhatsapp style={{ color: '#25d366', marginRight: 8 }} /><a href={`https://wa.me/${selectedJob.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25d366' }}>{selectedJob.whatsappNumber}</a></p>}
              {selectedJob.emergencyNumber && <p><FaPhone style={{ color: '#ff4444', marginRight: 8 }} /><a href={`tel:${selectedJob.emergencyNumber}`} style={{ color: '#ff4444' }}>{selectedJob.emergencyNumber}</a></p>}
            </div>
            <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setSelectedJob(null)}>Close</button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminJobs;