import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, getCountFromServer } from "firebase/firestore";
import AppLayout from "../components/AppLayout"; // ✅ Import AppLayout

const Dashboard = () => {
  const { user } = useAuth();
  const firstName = user?.email ? user.email.split('@')[0] : 'User';
  const [userRole, setUserRole] = useState(null);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [chatsCount, setChatsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [showSkillsForm, setShowSkillsForm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [profileStrength, setProfileStrength] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const [profilePromise, appsCountPromise, chatsCountPromise] = await Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getCountFromServer(query(collection(db, "needs"), where("applicants", "array-contains", user.uid))),
          getCountFromServer(query(collection(db, "chats"), where("participants", "array-contains", user.uid)))
        ]);

        if (profilePromise.exists()) {
          const data = profilePromise.data();
          const currentRole = data.role;
          const currentSkills = data.skills || [];
          
          setUserRole(currentRole);
          setSkills(currentSkills);
          
          if (!currentSkills || currentSkills.length === 0) setShowSkillsForm(true);
          
          let strength = 20;
          if (data.name) strength += 15;
          if (data.location) strength += 15;
          if (data.phone) strength += 15;
          if (data.jobTitle) strength += 15;
          if (currentSkills.length > 0) strength += 20;
          if (currentRole === 'employer' && data.organizationName) strength += 20;
          setProfileStrength(Math.min(strength, 100));

          if (currentRole === 'employee') {
            const jobsSnap = await getDocs(collection(db, "needs"));
            const allJobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const recommended = allJobs.filter(job => 
              job.status === 'open' && 
              currentSkills.some(skill => job.skillRequired.toLowerCase().includes(skill.toLowerCase()))
            );
            setRecommendedJobs(recommended.slice(0, 3));
          }
        } else {
          setShowSkillsForm(true);
        }

        setApplicationsCount(appsCountPromise.data().count);
        setChatsCount(chatsCountPromise.data().count);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    const newSkill = skillInput.trim();
    if (!skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSaveSkills = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), {
        skills: skills,
        updatedAt: new Date()
      }, { merge: true });
      setShowSkillsForm(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Error saving skills:", error);
      alert("Error saving skills");
    }
  };

  if (loading) {
    return <div className="dashboard-loader"><div className="loader-spinner"></div><p>Loading...</p></div>;
  }

  return (
    <AppLayout> {/* ✅ Wrap everything in AppLayout to get Hamburger + Bell */}
      {/* Profile Strength Meter */}
      <div className="profile-strength-meter">
        <h3>Profile Strength</h3>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${profileStrength}%` }}></div>
        </div>
        <p>{profileStrength}% Complete</p>
      </div>

      {showToast && (
        <div className="toast-notification">
          ✅ Skill(s) saved successfully!
        </div>
      )}

      <div className="welcome-banner">
        <h2>Welcome, {firstName} {userRole === 'employer' ? '🏢' : '💼'}!</h2>
        <p>{userRole === 'employer' ? 'Manage your needs and find talented volunteers.' : 'Find opportunities and showcase your skills.'}</p>
      </div>

      {showSkillsForm && (
        <div className="skills-form-card">
          <h3>🚀 Set Up Your Skills</h3>
          <p>Add your skills so organizations can find you!</p>
          <div className="skills-tags">
            {skills.map((skill, idx) => (
              <span key={idx} className="skill-tag">{skill} <button onClick={() => handleRemoveSkill(skill)} className="skill-remove">×</button></span>
            ))}
          </div>
          <div className="skills-input-row">
            <input type="text" className="input-field" placeholder="e.g. React, Design" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)} />
            <button className="btn btn-primary" onClick={handleAddSkill} style={{ width: 'auto', padding: '12px 20px' }}>Add</button>
          </div>
          <button className="btn btn-primary" onClick={handleSaveSkills} style={{ marginTop: '15px' }}>Save My Skills</button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">{userRole === 'employer' ? '📢' : '📄'}</div>
          <div><h3>{userRole === 'employer' ? 'Posted Jobs' : 'Applications'}</h3><p className="stat-number">{applicationsCount}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div><h3>Active Chats</h3><p className="stat-number">{chatsCount}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div><h3>Skills Listed</h3><p className="stat-number">{skills.length}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👀</div>
          <div><h3>Profile Status</h3><p className="stat-number">{profileStrength}%</p></div>
        </div>
      </div>

      {userRole === 'employee' && recommendedJobs.length > 0 && (
        <div className="recommended-jobs">
          <h3 className="section-title">🌟 Recommended Jobs For You</h3>
          <div className="needs-grid">
            {recommendedJobs.map(job => (
              <Link to={`/apply/${job.id}`} key={job.id} className="need-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="need-card-top">
                  <h3 className="need-title">{job.title}</h3>
                  <span className="bookmark-icon">💼</span>
                </div>
                <p className="need-org">🏢 {job.organizationName}</p>
                <p className="need-location">📍 {job.location}</p>
                <div className="need-tags"><span className="skill-badge">⚡ {job.skillRequired}</span></div>
                <span className="btn btn-primary" style={{ marginTop: '10px', textAlign: 'center' }}>Apply Now</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <h3 className="section-title">Quick Actions</h3>
      {userRole === 'employer' ? (
        <div className="quick-actions">
          <Link to="/post-need" className="action-btn"><span className="action-btn-icon">📢</span><span className="action-btn-text">Post a Need</span></Link>
          <Link to="/browse" className="action-btn"><span className="action-btn-icon">👀</span><span className="action-btn-text">Browse Volunteers</span></Link>
          <Link to="/messages" className="action-btn"><span className="action-btn-icon">💬</span><span className="action-btn-text">View Applicants</span></Link>
          <Link to="/profile" className="action-btn"><span className="action-btn-icon">🏢</span><span className="action-btn-text">Edit Organization</span></Link>
        </div>
      ) : (
        <div className="quick-actions">
          <Link to="/browse" className="action-btn"><span className="action-btn-icon">🔍</span><span className="action-btn-text">Find a Gig</span></Link>
          <Link to="/my-jobs" className="action-btn"><span className="action-btn-icon">📁</span><span className="action-btn-text">My Applications</span></Link>
          <Link to="/messages" className="action-btn"><span className="action-btn-icon">💬</span><span className="action-btn-text">Open Chats</span></Link>
          <Link to="/profile" className="action-btn"><span className="action-btn-icon">✏️</span><span className="action-btn-text">Edit Profile</span></Link>
        </div>
      )}
    </AppLayout>
  );
};

export default Dashboard;