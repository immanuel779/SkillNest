import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import TwoFAEnrollModal from "../components/TwoFAEnrollModal";
import { FaUser, FaCogs, FaBell, FaShieldAlt, FaExclamationTriangle, FaSave, FaTrash, FaCheckCircle, FaInfoCircle, FaSync, FaBug } from "react-icons/fa";

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [show2FAModal, setShow2FAModal] = useState(false);

  const defaultPlatform = { maintenance: false, allowSignups: true, allowPostings: true, allowApplications: true, allowChats: true };
  const defaultNotif = { emailAlerts: true, pushAlerts: true, inAppAlerts: true, autoCleanup: false };

  const [platform, setPlatform] = useState(defaultPlatform);
  const [notifPrefs, setNotifPrefs] = useState(defaultNotif);
  const [personal, setPersonal] = useState({ name: "", email: "", organization: "", phone: "", location: "" });
  const [twoFA, setTwoFA] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [userDocRes, settingsRes] = await Promise.all([
          getDoc(doc(db, "users", auth.currentUser.uid)),
          axios.get("http://localhost:5000/api/settings")
        ]);

        if (userDocRes.exists()) {
          const d = userDocRes.data();
          setPersonal({ name: d.name || "", email: d.email || "", organization: d.organizationName || "", phone: d.phone || "", location: d.location || "" });
          setTwoFA(d.twoFA || false);
        }

        if (settingsRes.data && settingsRes.data.platform) {
          setPlatform(settingsRes.data.platform);
          setNotifPrefs(settingsRes.data.notifications);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handlePersonalChange = (e) => setPersonal({ ...personal, [e.target.name]: e.target.value });
  const handlePlatformToggle = (key) => setPlatform({ ...platform, [key]: !platform[key] });
  const handleNotifToggle = (key) => setNotifPrefs({ ...notifPrefs, [key]: !notifPrefs[key] });

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        name: personal.name,
        organizationName: personal.organization,
        phone: personal.phone,
        location: personal.location,
        updatedAt: new Date()
      }, { merge: true });

      const token = await auth.currentUser.getIdToken(true);
      await axios.put("https://skillnest-88fd.onrender.com/api/settings", { platform, notifications: notifPrefs }, { headers: { Authorization: `Bearer ${token}` } });

      setMessage("✅ Settings saved successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("❌ Error saving settings. Check if backend is running.");
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleClearNotifications = async () => {
    if (!confirm("Clear ALL notifications?")) return;
    try {
      const { getDocs, collection, deleteDoc } = await import("firebase/firestore");
      const snap = await getDocs(collection(db, "notifications"));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      alert("✅ All notifications cleared!");
    } catch (e) { alert("Error clearing notifications."); }
  };

  const handleClearBugReports = async () => {
    if (!confirm("Clear ALL bug reports?")) return;
    try {
      const { getDocs, collection, deleteDoc } = await import("firebase/firestore");
      const snap = await getDocs(collection(db, "bug_reports"));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      alert("✅ All bug reports cleared!");
    } catch (e) { alert("Error clearing bug reports."); }
  };

  const handleResetAllData = async () => {
    if (!confirm("WARNING: This will delete ALL data! Are you sure?")) return;
    try {
      const { getDocs, collection, deleteDoc } = await import("firebase/firestore");
      const collections = ["users", "needs", "applications", "chats", "notifications", "bug_reports"];
      for (const col of collections) {
        const snap = await getDocs(collection(db, col));
        await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      }
      alert("All data has been reset.");
    } catch (e) { alert("Error resetting data."); }
  };

  const handle2FAEnrolled = () => {
    setTwoFA(true);
    setShow2FAModal(false);
  };

  const handleDisable2FA = async () => {
    if (!confirm("Are you sure you want to disable 2FA? This will remove your phone verification.")) return;
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), { twoFA: false }, { merge: true });
      setTwoFA(false);
      alert("2FA disabled.");
    } catch (e) { alert("Error disabling 2FA."); }
  };

  if (loading) return <div className="admin-loader"><div className="loader-spinner"></div><p>Loading Settings...</p></div>;

  return (
    <AppLayout>
      <div className="admin-header">
        <h1><FaCogs style={{ marginRight: '10px' }} />Admin Settings</h1>
        <span className="admin-badge"><FaShieldAlt style={{ marginRight: '5px' }} /> Configuration</span>
      </div>

      {message && <div className="success-alert">{message}</div>}

      {platform.maintenance && (
        <div className="system-alert-banner" style={{ background: "rgba(255,204,0,0.1)", border: "1px solid #ffcc00" }}>
          <FaExclamationTriangle style={{ color: '#ffcc00', marginRight: '10px', fontSize: '1.2rem' }} />
          <span>Platform is currently in <strong>Maintenance Mode</strong>. Users cannot access the app.</span>
        </div>
      )}

      <div className="settings-card">
        <h3 className="settings-section-title"><FaUser style={{ marginRight: '8px', color: '#ff8c00' }} />Admin Personal Profile</h3>
        <div className="settings-grid">
          <div className="avatar-box">
            <div className="premium-avatar"><FaShieldAlt size={40} color="#ff8c00" /></div>
            <p className="avatar-role">Administrator</p>
          </div>
          <div className="settings-fields">
            <div className="form-grid-2">
              <div className="form-group"><label className="form-label">Full Name</label><input className="input-field" type="text" name="name" value={personal.name} onChange={handlePersonalChange} /></div>
              <div className="form-group"><label className="form-label">Email (Login ID)</label><input className="input-field" type="email" value={personal.email} readOnly disabled /></div>
            </div>
            <div className="form-grid-2">
              <div className="form-group"><label className="form-label">Organization</label><input className="input-field" type="text" name="organization" value={personal.organization} onChange={handlePersonalChange} /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="input-field" type="tel" name="phone" value={personal.phone} onChange={handlePersonalChange} /></div>
            </div>
            <div className="form-group"><label className="form-label">Location</label><input className="input-field" type="text" name="location" value={personal.location} onChange={handlePersonalChange} /></div>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-section-title"><FaCogs style={{ marginRight: '8px', color: '#ff8c00' }} />Platform Settings</h3>
        {Object.entries(platform).map(([key, value]) => (
          <div className="settings-row" key={key}>
            <div><h4>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4><p style={{ opacity: 0.7 }}>Control this feature</p></div>
            <label className="switch"><input type="checkbox" checked={value} onChange={() => handlePlatformToggle(key)} /><span className="slider round"></span></label>
          </div>
        ))}
      </div>

      <div className="settings-card">
        <h3 className="settings-section-title"><FaBell style={{ marginRight: '8px', color: '#ff8c00' }} />Notification Preferences</h3>
        {Object.entries(notifPrefs).map(([key, value]) => (
          <div className="settings-row" key={key}>
            <div><h4>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4><p style={{ opacity: 0.7 }}>Control alerts</p></div>
            <label className="switch"><input type="checkbox" checked={value} onChange={() => handleNotifToggle(key)} /><span className="slider round"></span></label>
          </div>
        ))}
      </div>

      <div className="settings-card">
        <h3 className="settings-section-title"><FaShieldAlt style={{ marginRight: '8px', color: '#ff8c00' }} />Security</h3>
        <div className="settings-row">
          <div><h4>Two-Factor Authentication (2FA)</h4><p style={{ opacity: 0.7 }}>{twoFA ? <><FaCheckCircle style={{ color: '#00ff88', marginRight: '5px' }} />2FA is ENABLED.</> : <><FaInfoCircle style={{ color: '#ff8c00', marginRight: '5px' }} />2FA is DISABLED. Enable it to add an extra layer of security.</>}</p></div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {twoFA ? <button className="btn-sm" onClick={handleDisable2FA} style={{ background: 'rgba(255,0,0,0.2)', border: '1px solid #ff4444', color: '#ff4444' }}>Disable</button> : <button className="btn-sm" onClick={() => setShow2FAModal(true)} style={{ background: 'rgba(0,255,136,0.2)', border: '1px solid #00ff88', color: '#00ff88' }}><FaShieldAlt /> Enable 2FA</button>}
          </div>
        </div>
      </div>

      <div className="settings-card danger-zone">
        <h3 className="settings-section-title danger-zone-title"><FaTrash style={{ marginRight: '8px' }} /> Danger Zone</h3>
        <div className="danger-zone-buttons">
          <button className="btn-sm" onClick={handleClearNotifications} style={{ background: 'rgba(0,191,255,0.2)', border: '1px solid #00bfff', color: '#00bfff' }}><FaBell /> Clear Notifications</button>
          <button className="btn-sm" onClick={handleClearBugReports} style={{ background: 'rgba(255,140,0,0.2)', border: '1px solid #ff8c00', color: '#ff8c00' }}><FaBug /> Clear Bug Reports</button>
          <button className="btn-danger" onClick={handleResetAllData}><FaTrash /> Reset All Data</button>
        </div>
      </div>

      <button className="btn btn-primary" style={{ width: "100%", marginTop: "20px" }} onClick={handleSave} disabled={saving}>
        {saving ? <><FaSync className="spin" /> Saving...</> : <><FaSave /> Save & Apply Changes</>}
      </button>

      {show2FAModal && <TwoFAEnrollModal onClose={() => setShow2FAModal(false)} onEnrolled={handle2FAEnrolled} />}
    </AppLayout>
  );
};

export default AdminSettings;