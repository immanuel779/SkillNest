import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { useSettings } from "../context/SettingsContext";
import { FaUpload, FaWhatsapp, FaPhone } from "react-icons/fa";
import AppLayout from "../components/AppLayout"; // ✅ Import AppLayout

const PostNeed = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [formData, setFormData] = useState({
    title: "", description: "", skillRequired: "", organizationName: "", location: "", imageUrl: "", whatsappNumber: "", emergencyNumber: ""
  });
  const [file, setFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const skills = ["Frontend Developer", "Backend Developer", "Full Stack Developer", "UI/UX Designer", "Graphic Designer", "Data Analyst", "Content Writer", "Digital Marketer", "Video Editor", "Tutor", "Project Manager", "3D Designer", "Mobile App Developer", "Cybersecurity Specialist", "Virtual Assistant"];
  const locations = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Kaduna", "Ogun", "Remote", "Other"];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const uploadBrandImage = async () => {
    if (!file) return "";
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch("https://skillnest-88fd.onrender.com/api/upload", {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setUploadingImage(false);
      return data.url;
    } catch (error) {
      setUploadingImage(false);
      setError("Error uploading image. Please try again.");
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setMessage(null);

    if (!settings.platform.allowPostings) {
      setError("Job postings are currently disabled. Please contact the admin team.");
      setLoading(false);
      return;
    }

    if (!auth.currentUser) {
      setError("You must be logged in to post a job.");
      setLoading(false);
      return;
    }

    try {
      const imageUrl = await uploadBrandImage();
      if (imageUrl === null) { setLoading(false); return; }

      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch("http://localhost:5000/api/needs", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ ...formData, imageUrl })
      });
      const data = await response.json();

      if (response.status === 401) {
        setError("Session expired. Please log out and log back in.");
      } else if (response.status === 403) {
        setError(data.error || "You do not have permission to post.");
      } else if (!response.ok) {
        setError(data.error || "Error posting need.");
      } else {
        setMessage("Need posted successfully! Redirecting...");
        setTimeout(() => navigate("/browse"), 1500);
      }
    } catch (err) {
      setError("Backend is not running! Open your backend terminal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout> {/* ✅ Wrapped with AppLayout for Hamburger + Bell! */}
      <div className="form-page-wrapper">
        <div className="glass-card form-card">
          <h1 className="logo-text" style={{ fontSize: "2rem", marginBottom: "10px" }}>Post a Need</h1>
          <p style={{ textAlign: "center", opacity: 0.7, marginBottom: "30px" }}>Provide details about the skill you need for your community.</p>
          {message && <div className="success-alert">✅ {message}</div>}
          {error && <div className="error-alert">❌ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label"><FaUpload /> Upload Brand Picture (Optional)</label>
              <div className="brand-upload-area">
                {file && <img src={URL.createObjectURL(file)} alt="Brand Preview" className="brand-preview-img" />}
                <input type="file" accept="image/*" onChange={handleFileChange} className="input-field file-input" />
                {uploadingImage && <small style={{ color: "#ff8c00" }}>Uploading image...</small>}
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group"><label className="form-label">Job Title</label><input className="input-field" type="text" name="title" placeholder="e.g. React Developer Needed" value={formData.title} onChange={handleChange} required /></div>
              <div className="form-group"><label className="form-label">Skill Required</label><select className="input-field" name="skillRequired" value={formData.skillRequired} onChange={handleChange} required><option value="">Select Skill</option>{skills.map(skill => <option key={skill} value={skill}>{skill}</option>)}</select></div>
            </div>
            <div className="form-grid-2">
              <div className="form-group"><label className="form-label">Organization Name</label><input className="input-field" type="text" name="organizationName" placeholder="e.g. Creastech Limited" value={formData.organizationName} onChange={handleChange} required /></div>
              <div className="form-group"><label className="form-label">Location</label><select className="input-field" name="location" value={formData.location} onChange={handleChange} required><option value="">Select Location</option>{locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select></div>
            </div>
            <div className="form-grid-2">
              <div className="form-group"><label className="form-label"><FaWhatsapp /> WhatsApp Number *</label><input className="input-field" type="tel" name="whatsappNumber" placeholder="e.g. +234 801 234 5678" value={formData.whatsappNumber} onChange={handleChange} required /></div>
              <div className="form-group"><label className="form-label"><FaPhone /> Emergency Number (Optional)</label><input className="input-field" type="tel" name="emergencyNumber" placeholder="e.g. +234 901 234 5678" value={formData.emergencyNumber} onChange={handleChange} /></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="input-field textarea-field" name="description" placeholder="Describe what the volunteer will be doing..." value={formData.description} onChange={handleChange} rows="5" required></textarea></div>
            <button className="btn btn-primary" type="submit" disabled={loading || uploadingImage}>{loading || uploadingImage ? "Posting..." : "Post Need"}</button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default PostNeed;