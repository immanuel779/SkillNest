import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import AppLayout from "../components/AppLayout"; // ✅ Import AppLayout

const MyJobs = () => {
  const { user } = useAuth();
  const [role, setRole] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usersMap, setUsersMap] = useState({});

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        let userData = null;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          userData = userDoc.data();
        } else {
          const q = query(collection(db, "users"), where("email", "==", user.email));
          const snap = await getDocs(q);
          if (!snap.empty) userData = snap.docs[0].data();
        }

        const usersSnapshot = await getDocs(collection(db, "users"));
        const map = {};
        usersSnapshot.docs.forEach(userDoc => {
          const data = userDoc.data();
          map[userDoc.id] = data;
          if (data.email) map[data.email] = data;
        });
        setUsersMap(map);

        if (userData) {
          setRole(userData.role);

          if (userData.role === 'employer') {
            const jobsSnap = await getDocs(query(collection(db, "needs"), where("createdBy", "==", user.uid)));
            const jobsList = jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setJobs(jobsList);

            const appsMap = {};
            for (const job of jobsList) {
              const appSnap = await getDocs(query(collection(db, "applications"), where("needId", "==", job.id)));
              appsMap[job.id] = appSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
            setApplications(appsMap);
          } else {
            const jobsSnap = await getDocs(query(collection(db, "needs"), where("applicants", "array-contains", user.uid)));
            setJobs(jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const appSnap = await getDocs(query(collection(db, "applications"), where("volunteerId", "==", user.uid)));
            const statusMap = {};
            appSnap.docs.forEach(doc => { statusMap[doc.data().needId] = doc.data().status; });
            setApplications(statusMap);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error fetching data. Is your backend running?");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const getApplicantName = (app) => {
    if (app.fullName) return app.fullName;
    return usersMap[app.volunteerId]?.name || usersMap[app.volunteerEmail]?.name || "Unknown User";
  };

  const applicationSteps = [
    { status: 'Applied', icon: '📄' },
    { status: 'Viewed', icon: '👁️' },
    { status: 'Shortlisted', icon: '📝' },
    { status: 'Interview', icon: '🎤' },
    { status: 'Hired', icon: '🎉' }
  ];

  const getCurrentStepIndex = (status) => {
    if (status === 'pending' || status === 'Applied') return 0;
    if (status === 'viewed') return 1;
    if (status === 'shortlisted') return 2;
    if (status === 'interview') return 3;
    if (status === 'hired' || status === 'accepted') return 4;
    return 0;
  };

  if (loading) return <div className="dashboard-loader"><div className="loader-spinner"></div><p>Loading...</p></div>;

  return (
    <AppLayout> {/* ✅ Wrapped with AppLayout for Hamburger + Bell! */}
      <h1>{role === 'employer' ? 'My Posted Jobs' : 'My Applications'}</h1>

      {error && <div className="error-alert">❌ {error}</div>}

      {jobs.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>{role === 'employer' ? 'No jobs posted yet' : 'No applications yet'}</h3>
          <p style={{ opacity: 0.7, marginBottom: '20px' }}>
            {role === 'employer' ? 'Post a job to start receiving applications!' : 'Browse opportunities to apply!'}
          </p>
          <Link to={role === 'employer' ? '/post-need' : '/browse'} className="btn btn-primary" style={{ width: 'auto', padding: '12px 25px' }}>
            {role === 'employer' ? '➕ Post a Job' : '🔍 Find a Job'}
          </Link>
        </div>
      )}

      <div className="needs-grid">
        {jobs.map(job => (
          <div key={job.id} className="need-card">
            <div className="need-card-top">
              <h3 className="need-title">{job.title}</h3>
              <span className="status-badge">{job.status || 'open'}</span>
            </div>
            <p className="need-org">🏢 {job.organizationName}</p>
            <p className="need-location">📍 {job.location}</p>

            {role === 'employer' && applications[job.id] && applications[job.id].length > 0 && (
              <div className="applicants-section">
                <h4>Applicants ({applications[job.id].length})</h4>
                {applications[job.id].map(app => (
                  <div key={app.id} className="applicant-card">
                    <div><strong>{getApplicantName(app)}</strong><p>{app.experience} · {app.location}</p></div>
                    <span className="status-badge">{app.status}</span>
                  </div>
                ))}
              </div>
            )}

            {role === 'employee' && (
              <div className="application-timeline">
                <h4>Application Tracker</h4>
                <div className="timeline-steps">
                  {applicationSteps.map((step, idx) => (
                    <div key={idx} className={`timeline-step ${idx <= getCurrentStepIndex(applications[job.id]) ? 'completed' : ''}`}>
                      <div className="timeline-icon">{step.icon}</div>
                      <p>{step.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default MyJobs;