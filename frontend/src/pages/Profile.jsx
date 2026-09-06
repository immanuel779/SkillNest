import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { updatePassword, deleteUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaTrash, FaUpload, FaFilePdf, FaFileImage, FaUser, FaLock, FaBell, FaSignOutAlt } from "react-icons/fa";
import AppLayout from "../components/AppLayout";

// ✅ LIVE BACKEND URL
const BACKEND_URL = "https://skillnest-88fd.onrender.com";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: "", email: "", role: "", organization: "", location: "Lagos",
    jobTitle: "", bio: "", language: "English (US)", timezone: "UTC+01:00 (Lagos)",
    avatarUrl: "", cvUrl: "", cvFileName: "", twoFA: false
  });

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);

  const locations = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Kaduna", "Ogun", "Remote", "Other"];

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || user.displayName || "",
            email: data.email || user.email || "",
            role: data.role || "employee",
            organization: data.organizationName || "",
            location: data.location || "Lagos",
            jobTitle: data.jobTitle || (data.role === "employer" ? "HR Manager" : "Web Developer"),
            bio: data.bio || "",
            language: data.language || "English (US)",
            timezone: data.timezone || "UTC+01:00 (Lagos)",
            avatarUrl: data.avatarUrl || "",
            cvUrl: data.cvUrl || "",
            cvFileName: data.cvFileName || "",
            twoFA: data.twoFA || false
          });
          setSkills(data.skills || []);
        }
      } catch (error) { console.error("Error fetching profile:", error); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [user]);

  const isEmployer = formData.role === "employer";
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleAddSkill = (e) => { e.preventDefault(); if (!skillInput.trim()) return; const newSkill = skillInput.trim(); if (!skills.includes(newSkill)) { setSkills([...skills, newSkill]); setSkillInput(""); } };
  const handleRemoveSkill = (skillToRemove) => setSkills(skills.filter(skill => skill !== skillToRemove));

  const handleSave = async () => {
    setSaving(true); setSaveMessage(null);
    try {
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name, organizationName: formData.organization, location: formData.location, jobTitle: formData.jobTitle,
        bio: formData.bio, language: formData.language, timezone: formData.timezone, twoFA: formData.twoFA,
        ...(isEmployer ? {} : { skills: skills, cvUrl: formData.cvUrl, cvFileName: formData.cvFileName }), updatedAt: new Date()
      }, { merge: true });
      setSaveMessage("✅ Profile updated successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) { setSaveMessage("❌ Error saving profile."); setTimeout(() => setSaveMessage(null), 3000); }
    finally { setSaving(false); }
  };

  // ✅ REAL-TIME PROFILE PICTURE UPLOAD (Now using LIVE URL)
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData(); formData.append("file", file);
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      
      setFormData(prev => ({ ...prev, avatarUrl: data.url }));
      await setDoc(doc(db, "users", user.uid), { avatarUrl: data.url }, { merge: true });
      setSaveMessage("✅ Profile picture updated!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) { alert("Error uploading avatar. Check your backend."); }
    finally { setUploadingAvatar(false); }
  };

  const handleCVUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) { alert("Please upload a PDF or an image file (JPG, PNG)."); return; }
    setUploadingCV(true);
    try {
      const formData = new FormData(); formData.append("file", file);
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setFormData(prev => ({ ...prev, cvUrl: data.url, cvFileName: file.name }));
      alert("CV uploaded! Click Save Changes to apply.");
    } catch (error) { alert("Error uploading CV. Check your backend."); }
    finally { setUploadingCV(false); }
  };

  const handleDeleteCV = () => { if (!confirm("Are you sure you want to delete your CV?")) return; setFormData(prev => ({ ...prev, cvUrl: "", cvFileName: "" })); alert("CV deleted! Click Save Changes to apply."); };

  // ✅ REAL-TIME PROFILE PICTURE DELETION
  const handleDeletePhoto = async () => {
    if (!confirm("Are you sure you want to delete your profile picture?")) return;
    setFormData(prev => ({ ...prev, avatarUrl: "" }));
    try {
      await setDoc(doc(db, "users", user.uid), { avatarUrl: "" }, { merge: true });
      setSaveMessage("✅ Profile picture deleted!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting picture:", error);
      alert("Error deleting picture.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault(); setUpdatingPassword(true); setPasswordMessage(null);
    try {
      await updatePassword(auth.currentUser, newPassword);
      setPasswordMessage("✅ Password changed successfully!");
      setCurrentPassword(""); setNewPassword("");
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (error) { setPasswordMessage("❌ Error changing password: " + error.message); setTimeout(() => setPasswordMessage(null), 3000); }
    finally { setUpdatingPassword(false); }
  };

  const handleToggle2FA = () => {
    const newState = !formData.twoFA;
    setFormData(prev => ({ ...prev, twoFA: newState }));
    alert(newState ? "🔐 2FA Enabled!" : "2FA Disabled.");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("WARNING: This will permanently delete your account and all your data! Are you sure?")) return;
    try { await deleteDoc(doc(db, "users", user.uid)); await deleteUser(auth.currentUser); window.location.href = "/"; }
    catch (error) { alert("Error deleting account. " + error.message); }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading) return <div className="dashboard-loader"><div className="loader-spinner"></div><p>Loading Profile...</p></div>;

  return (
    <AppLayout> {/* ✅ Wrapped with AppLayout for Hamburger + Bell! */}
      <div className="settings-content">
        <div className="topbar">
          <h1>Account Settings</h1>
          <div className="user-actions">
            <div className="user-profile-pill"><span>👤</span> {formData.name.split(' ')[0]}</div>
            <button className="logout-btn-sidebar" style={{ marginLeft: '10px' }} onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        {saveMessage && <div className="toast-notification" style={{ position: 'static', marginBottom: '20px', animation: 'none' }}>{saveMessage}</div>}

        <div className="settings-card">
          <h3 className="settings-section-title"><FaUser /> Personal Profile</h3>
          <div className="settings-grid">
            <div className="avatar-box">
              {formData.avatarUrl ? <img src={formData.avatarUrl} alt="Profile" className="profile-avatar-img" /> : <div className="premium-avatar"><FaUser size={40} color="#ff8c00" /></div>}
              <label className="btn btn-primary" style={{ width: 'auto', padding: '8px 15px', fontSize: '0.8rem', cursor: 'pointer' }}>
                {uploadingAvatar ? "Uploading..." : <><FaCamera /> Upload Picture</>}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
              {formData.avatarUrl && <button className="delete-photo-btn" onClick={handleDeletePhoto}><FaTrash /> Delete Photo</button>}
              <p className="avatar-role">{isEmployer ? '🏢 Employer' : '💼 Job Seeker'}</p>
            </div>

            <div className="settings-fields">
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Full Name</label><input className="input-field" type="text" name="name" value={formData.name} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Email (Login ID)</label><input className="input-field" type="email" name="email" value={formData.email} readOnly disabled /></div>
              </div>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Job Title</label><input className="input-field" type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">{isEmployer ? "Organization Name" : "Organization (Optional)"}</label><input className="input-field" type="text" name="organization" value={formData.organization} onChange={handleChange} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <select className="input-field" name="location" value={formData.location} onChange={handleChange}>{locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select>
              </div>
              <div className="form-group">
                <label className="form-label">Bio / About Me</label>
                <textarea className="input-field textarea-field" name="bio" placeholder="Tell employers about yourself or what your organization does..." value={formData.bio} onChange={handleChange} rows="3"></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* ... Rest of the page (Skills, CV, Preferences, Security, Delete Account) ... */}
        
        <button className="btn btn-primary save-settings-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving Changes..." : "Save All Changes"}
        </button>
      </div>
    </AppLayout>
  );
};

export default Profile;