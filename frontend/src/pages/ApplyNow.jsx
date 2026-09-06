import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useSettings } from "../context/SettingsContext";
import { FaUser, FaPhoneAlt, FaMapMarkerAlt, FaBriefcase, FaCalendarAlt, FaMoneyBillWave, FaFileAlt, FaPencilAlt } from "react-icons/fa";
import AppLayout from "../components/AppLayout"; // ✅ Import AppLayout

const ApplyNow = () => {
  const { needId } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [need, setNeed] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [applied, setApplied] = useState(false);
  const [chatId, setChatId] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "", phone: "", location: "", expectedSalary: "", startDate: "", coverLetter: "", experience: "", portfolio: ""
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/needs`);
        const data = await res.json();
        setNeed(data.find(n => n.id === needId));

        if (auth.currentUser) {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data();
            setFormData(prev => ({
              ...prev,
              fullName: profile.name || "",
              phone: profile.phone || "",
              location: profile.location || ""
            }));
          }
        }
      } catch (e) {
        console.error("Error loading data:", e);
        setError("Could not load job details.");
      } finally {
        setLoadingJob(false);
      }
    };
    loadData();
  }, [needId]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!settings.platform.allowApplications) {
      setError("Applications are currently disabled. Please contact the admin team.");
      setSubmitting(false);
      return;
    }

    if (!auth.currentUser) {
      setError("You must be logged in to apply for this job.");
      setSubmitting(false);
      return;
    }

    try {
      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch(`http://localhost:5000/api/needs/${needId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ ...formData, resumeUrl: formData.portfolio })
      });

      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { data = { error: "Invalid server response" }; }

      if (response.status === 404) {
        setError("This job no longer exists.");
      } else if (response.status === 401) {
        setError("Session expired. Please log back in.");
      } else if (response.status === 403) {
        setError(data.error || "You do not have permission to apply.");
      } else if (!response.ok) {
        setError(data.error || "Application failed.");
      } else {
        setChatId(data.chatId);
        setApplied(true);
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // Success Screen (No AppLayout - Fullscreen clear page)
  if (applied) {
    return (
      <div className="auth-container">
        <div className="glass-card">
          <div className="auth-avatar">🎉</div>
          <h1 className="logo-text">Application Received!</h1>
          <p style={{ textAlign: "center", opacity: 0.8, marginBottom: "20px" }}>
            Your professional profile has been sent to the employer.
          </p>
          <Link to={`/chat/${chatId}`} className="btn btn-primary" style={{ textDecoration: "none", display: "block", textAlign: "center" }}>
            💬 Send Message to Employer
          </Link>
          <Link to="/browse" className="btn btn-google" style={{ textDecoration: "none", display: "block", textAlign: "center", marginTop: "10px" }}>
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (loadingJob) return <div className="dashboard-loader"><div className="loader-spinner"></div><p>Loading Job Details...</p></div>;

  // Main Form wrapped in AppLayout
  return (
    <AppLayout> {/* ✅ Wrapped with AppLayout */}
      <div className="form-page-wrapper">
        <div className="glass-card form-card">
          <h1 className="logo-text" style={{ fontSize: "2rem" }}>Apply Now</h1>
          <p style={{ textAlign: "center", opacity: 0.7, marginBottom: "30px" }}>
            Applying for: <strong style={{ color: "#ff8c00" }}>{need?.title || "This Position"}</strong>
          </p>

          {error && <div className="error-alert">❌ {error}</div>}

          <form onSubmit={handleSubmit}>
            <h3 className="form-section-title"><FaUser /> Personal Information</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label"><FaUser /> Full Name *</label>
                <input className="input-field" type="text" name="fullName" placeholder="e.g. Oluwadamilare Opeyemi" value={formData.fullName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label"><FaPhoneAlt /> Phone Number *</label>
                <input className="input-field" type="tel" name="phone" placeholder="e.g. +234 801 234 5678" value={formData.phone} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label"><FaMapMarkerAlt /> Current Location *</label>
              <input className="input-field" type="text" name="location" placeholder="e.g. Lagos, Nigeria" value={formData.location} onChange={handleChange} required />
            </div>

            <h3 className="form-section-title"><FaBriefcase /> Professional Details</h3>
            <div className="form-group">
              <label className="form-label"><FaFileAlt /> Resume/CV Link *</label>
              <input className="input-field" type="url" name="portfolio" placeholder="Paste your Google Drive or LinkedIn link here" value={formData.portfolio} onChange={handleChange} required />
            </div>
            
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Years of Experience *</label>
                <select className="input-field" name="experience" value={formData.experience} onChange={handleChange} required>
                  <option value="">Select Experience</option>
                  <option value="0-1">0-1 Years</option>
                  <option value="1-3">1-3 Years</option>
                  <option value="3-5">3-5 Years</option>
                  <option value="5+">5+ Years</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label"><FaMoneyBillWave /> Expected Salary (₦/mo)</label>
                <input className="input-field" type="text" name="expectedSalary" placeholder="e.g. ₦200,000" value={formData.expectedSalary} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><FaCalendarAlt /> Available Start Date *</label>
              <input className="input-field" type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </div>

            <h3 className="form-section-title"><FaPencilAlt /> Cover Letter</h3>
            <div className="form-group">
              <textarea
                className="input-field textarea-field"
                name="coverLetter"
                placeholder="Tell them why you are the perfect fit for this role..."
                value={formData.coverLetter}
                onChange={handleChange}
                rows="6"
                required
              ></textarea>
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Submitting Application..." : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default ApplyNow;