import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { FaBell } from "react-icons/fa";
import AppLayout from "../components/AppLayout"; // ✅ Import AppLayout

const SavedAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const snap = await getDocs(collection(db, "alerts"));
        const userAlerts = snap.docs.filter(d => d.data().userId === auth.currentUser.uid);
        setAlerts(userAlerts.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchAlerts();
  }, []);

  const handleAddAlert = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "alerts"), {
        userId: auth.currentUser.uid,
        skill, location,
        createdAt: new Date()
      });
      setSkill(""); setLocation("");
      const snap = await getDocs(collection(db, "alerts"));
      const userAlerts = snap.docs.filter(d => d.data().userId === auth.currentUser.uid);
      setAlerts(userAlerts.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { alert("Error saving alert"); }
  };

  const handleDelete = async (id) => {
    try { await deleteDoc(doc(db, "alerts", id)); setAlerts(alerts.filter(a => a.id !== id)); }
    catch (e) { alert("Error deleting"); }
  };

  if (loading) return <div className="dashboard-loader"><div className="loader-spinner"></div></div>;

  return (
    <AppLayout> {/* ✅ Wrapped with AppLayout for Hamburger + Bell! */}
      <h1>Saved Job Alerts</h1>
      <div className="glass-card">
        <form onSubmit={handleAddAlert}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Skill Alert</label>
              <input className="input-field" placeholder="e.g. React Developer" value={skill} onChange={(e) => setSkill(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Location Alert</label>
              <input className="input-field" placeholder="e.g. Lagos" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit"><FaBell /> Save Alert</button>
        </form>
      </div>

      <h3 className="section-title">Your Alerts</h3>
      <div className="chat-list">
        {alerts.length === 0 && <p style={{ opacity: 0.7 }}>No alerts saved yet.</p>}
        {alerts.map(alert => (
          <div key={alert.id} className="chat-list-item">
            <div className="chat-info">
              <h4>{alert.skill}</h4>
              <p style={{ opacity: 0.7 }}>{alert.location || "Anywhere"}</p>
            </div>
            <button className="btn-danger" onClick={() => handleDelete(alert.id)}>Delete</button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default SavedAlerts;