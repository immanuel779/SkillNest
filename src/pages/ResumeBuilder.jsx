import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { jsPDF } from "jspdf";
import { FaSave, FaDownload, FaTrash, FaUser, FaBriefcase, FaGraduationCap, FaMapMarkerAlt, FaEnvelope, FaPhone } from "react-icons/fa";
import AppLayout from "../components/AppLayout"; // ✅ Import AppLayout

const ResumeBuilder = () => {
  const [resumeData, setResumeData] = useState({
    name: "", email: "", phone: "", location: "",
    summary: "", skills: "", education: "", experience: ""
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Load existing resume data
  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchData = async () => {
      try {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().resumeData) {
          setResumeData(docSnap.data().resumeData);
        }
      } catch (error) {
        console.error("Error fetching resume:", error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => setResumeData({ ...resumeData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!auth.currentUser) { setMessage("You must be logged in to save."); return; }
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), { resumeData }, { merge: true });
      setMessage("✅ Resume saved successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage("❌ Error saving resume.");
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (!confirm("Are you sure you want to clear all fields?")) return;
    setResumeData({ name: "", email: "", phone: "", location: "", summary: "", skills: "", education: "", experience: "" });
  };

  const handleDownload = () => {
    if (!resumeData.name) { setMessage("Please enter your name first."); setTimeout(() => setMessage(null), 3000); return; }

    const doc = new jsPDF();
    
    // 1. Premium Orange Header
    doc.setFillColor(255, 140, 0); // Orange
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(resumeData.name || "Your Name", 10, 20);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`${resumeData.email || ""}  |  ${resumeData.phone || ""}`, 10, 28);
    doc.text(`${resumeData.location || ""}`, 10, 32);

    // 2. Summary Section
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PROFESSIONAL SUMMARY", 10, 50);
    doc.setDrawColor(255, 140, 0);
    doc.line(10, 52, 200, 52);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(resumeData.summary || "", 10, 60, { maxWidth: 190 });

    // 3. Skills Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CORE SKILLS", 10, 85);
    doc.line(10, 87, 200, 87);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(resumeData.skills || "", 10, 95, { maxWidth: 190 });

    // 4. Education Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("EDUCATION", 10, 120);
    doc.line(10, 122, 200, 122);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(resumeData.education || "", 10, 130, { maxWidth: 190 });

    // 5. Experience Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("WORK EXPERIENCE", 10, 155);
    doc.line(10, 157, 200, 157);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(resumeData.experience || "", 10, 165, { maxWidth: 190 });

    // Save PDF
    doc.save(`${resumeData.name || "Resume"}_Resume.pdf`);
    setMessage("✅ PDF downloaded!");
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <AppLayout> {/* ✅ Wrapped with AppLayout for Hamburger + Bell! */}
      <div className="resume-builder-container">
        <div className="browse-header">
          <h1>📄 Resume Builder</h1>
          <button className="btn-google" onClick={handleClear} style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaTrash /> Clear
          </button>
        </div>

        {message && <div className="toast-notification" style={{ position: 'static', marginBottom: '20px', animation: 'none' }}>{message}</div>}

        <div className="glass-card form-card">
          {/* Header */}
          <div className="resume-header">
            <FaUser size={30} color="#ff8c00" />
            <h3>Build Your Professional Resume</h3>
            <p>Fill the details below and download a premium PDF instantly.</p>
          </div>

          {/* Personal Info */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label"><FaUser /> Full Name</label>
              <input className="input-field" name="name" placeholder="e.g. Oluwadamilare Opeyemi" value={resumeData.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label"><FaEnvelope /> Email</label>
              <input className="input-field" name="email" placeholder="e.g. you@email.com" value={resumeData.email} onChange={handleChange} />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label"><FaPhone /> Phone</label>
              <input className="input-field" name="phone" placeholder="e.g. +234 801 234 5678" value={resumeData.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label"><FaMapMarkerAlt /> Location</label>
              <input className="input-field" name="location" placeholder="e.g. Lagos, Nigeria" value={resumeData.location} onChange={handleChange} />
            </div>
          </div>

          {/* Summary */}
          <div className="form-group">
            <label className="form-label">Professional Summary</label>
            <textarea className="input-field textarea-field" name="summary" placeholder="Briefly describe your professional background and goals..." value={resumeData.summary} onChange={handleChange} rows="3" />
          </div>

          {/* Skills */}
          <div className="form-group">
            <label className="form-label">Core Skills (comma separated)</label>
            <input className="input-field" name="skills" placeholder="e.g. React, Node.js, Figma, Marketing" value={resumeData.skills} onChange={handleChange} />
          </div>

          {/* Education */}
          <div className="form-group">
            <label className="form-label"><FaGraduationCap /> Education</label>
            <textarea className="input-field textarea-field" name="education" placeholder="e.g. BSc Computer Science, University of Lagos (2019 - 2023)" value={resumeData.education} onChange={handleChange} rows="2" />
          </div>

          {/* Experience */}
          <div className="form-group">
            <label className="form-label"><FaBriefcase /> Work Experience</label>
            <textarea className="input-field textarea-field" name="experience" placeholder="e.g. Frontend Developer at Creastech (2023 - Present)" value={resumeData.experience} onChange={handleChange} rows="4" />
          </div>

          {/* Buttons */}
          <div className="resume-actions">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <FaSave /> {saving ? "Saving..." : "Save Resume"}
            </button>
            <button className="btn btn-google" onClick={handleDownload}>
              <FaDownload /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ResumeBuilder;