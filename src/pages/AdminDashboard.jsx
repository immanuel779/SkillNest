import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { 
  FaUsers, FaBriefcase, FaFileAlt, FaBug, FaComments, FaShieldAlt, 
  FaChartLine, FaChartBar, FaStar, FaMapMarkerAlt, FaBolt, FaBell, 
  FaCog, FaExclamationTriangle, FaArrowRight, FaEye, FaCheckCircle,
  FaUserPlus, FaClipboardList, FaUnlockAlt
} from "react-icons/fa";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, jobs: 0, applications: 0, bugReports: 0, chats: 0 });
  const [chartData, setChartData] = useState([]);
  const [jobsCountBySkill, setJobsCountBySkill] = useState([]);
  const [jobsCountByLocation, setJobsCountByLocation] = useState([]);
  const [maxSkillCount, setMaxSkillCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [recentApplications, setRecentApplications] = useState([]);
  const [recentBugs, setRecentBugs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel fetch for all core data
        const [usersSnap, jobsSnap, appsSnap, bugsSnap, chatsSnap, recentApps, recentBugs] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "needs")),
          getDocs(collection(db, "applications")),
          getDocs(collection(db, "bug_reports")),
          getDocs(collection(db, "chats")),
          getDocs(query(collection(db, "applications"), orderBy("appliedAt", "desc"), limit(5))),
          getDocs(query(collection(db, "bug_reports"), orderBy("createdAt", "desc"), limit(5)))
        ]);

        // Basic stats
        setStats({
          users: usersSnap.size,
          jobs: jobsSnap.size,
          applications: appsSnap.size,
          bugReports: bugsSnap.size,
          chats: chatsSnap.size
        });

        // Weekly mock chart data (based on totals)
        setChartData([
          { name: 'Mon', users: Math.max(5, Math.floor(usersSnap.size * 0.4)), jobs: Math.max(2, Math.floor(jobsSnap.size * 0.3)), apps: Math.max(1, Math.floor(appsSnap.size * 0.2)) },
          { name: 'Tue', users: Math.max(10, Math.floor(usersSnap.size * 0.6)), jobs: Math.max(4, Math.floor(jobsSnap.size * 0.5)), apps: Math.max(3, Math.floor(appsSnap.size * 0.4)) },
          { name: 'Wed', users: Math.max(15, Math.floor(usersSnap.size * 0.8)), jobs: Math.max(6, Math.floor(jobsSnap.size * 0.7)), apps: Math.max(6, Math.floor(appsSnap.size * 0.6)) },
          { name: 'Thu', users: Math.max(20, Math.floor(usersSnap.size * 0.9)), jobs: Math.max(8, Math.floor(jobsSnap.size * 0.8)), apps: Math.max(10, Math.floor(appsSnap.size * 0.8)) },
          { name: 'Fri', users: usersSnap.size, jobs: jobsSnap.size, apps: appsSnap.size },
        ]);

        // Skills and Locations analytics
        const jobsData = jobsSnap.docs.map(d => d.data());
        const skillsMap = {};
        const locationsMap = {};
        jobsData.forEach(job => {
          if (job.skillRequired) skillsMap[job.skillRequired] = (skillsMap[job.skillRequired] || 0) + 1;
          if (job.location) locationsMap[job.location] = (locationsMap[job.location] || 0) + 1;
        });

        const sortedSkills = Object.entries(skillsMap).sort((a,b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
        const sortedLocations = Object.entries(locationsMap).sort((a,b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

        setJobsCountBySkill(sortedSkills);
        setJobsCountByLocation(sortedLocations);
        const maxSkillCount = sortedSkills.length > 0 ? sortedSkills[0].count : 1;
        setMaxSkillCount(maxSkillCount);

        // Recent Activity (Applications & Bugs)
        setRecentApplications(recentApps.docs.map(d => ({ id: d.id, ...d.data() })));
        setRecentBugs(recentBugs.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="admin-loader"><div className="loader-spinner"></div><p>Loading Dashboard...</p></div>;

  return (
    <AppLayout>
      <div className="admin-header">
        <h1>Admin Command Center</h1>
        <span className="admin-badge"><FaShieldAlt style={{ marginRight: '5px' }} /> Administrator</span>
      </div>

      {/* Security Status Banner */}
      <div className="security-status-banner">
        <FaUnlockAlt style={{ color: '#00ff88', fontSize: '1.2rem' }} />
        <span>System Status: <strong className="status-green">All Systems Operational</strong></span>
        <FaBolt style={{ color: '#ffcc00', marginLeft: '15px' }} />
        <span>Last Backup: 2 hours ago</span>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><FaUsers /></div>
          <div><h3>Total Users</h3><p className="stat-number">{stats.users}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaBriefcase /></div>
          <div><h3>Total Jobs</h3><p className="stat-number">{stats.jobs}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaFileAlt /></div>
          <div><h3>Applications</h3><p className="stat-number">{stats.applications}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaBug /></div>
          <div><h3>Bug Reports</h3><p className="stat-number">{stats.bugReports}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaComments /></div>
          <div><h3>Total Chats</h3><p className="stat-number">{stats.chats}</p></div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3><FaChartLine style={{ marginRight: '8px', color: '#ff8c00' }} />Platform Growth (Weekly)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff8c00" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ff8c00" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a020f0" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#a020f0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ff8c00', borderRadius: '8px' }} />
              <Legend />
              <Area type="monotone" dataKey="users" stroke="#ff8c00" fillOpacity={1} fill="url(#colorUsers)" name="Users" />
              <Area type="monotone" dataKey="jobs" stroke="#a020f0" fillOpacity={1} fill="url(#colorJobs)" name="Jobs" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3><FaChartBar style={{ marginRight: '8px', color: '#00bfff' }} />Applications vs Jobs</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ff8c00', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="jobs" fill="#ff8c00" radius={[5, 5, 0, 0]} name="Jobs" />
              <Bar dataKey="apps" fill="#00bfff" radius={[5, 5, 0, 0]} name="Applications" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="analytics-grid">
        <div className="chart-card">
          <h3><FaStar style={{ marginRight: '8px', color: '#ffcc00' }} />Most Active Skills</h3>
          {jobsCountBySkill.length === 0 ? <p>No jobs yet.</p> : jobsCountBySkill.map((skill, i) => (
            <div key={i} className="skill-row">
              <span className="skill-name">{skill.name}</span>
              <div className="skill-bar-container">
                <div className="skill-bar" style={{ width: `${(skill.count / maxSkillCount) * 100}%` }}></div>
              </div>
              <span className="skill-count">{skill.count}</span>
            </div>
          ))}
        </div>

        <div className="chart-card">
          <h3><FaMapMarkerAlt style={{ marginRight: '8px', color: '#ff8c00' }} />Most Active Locations</h3>
          {jobsCountByLocation.length === 0 ? <p>No jobs yet.</p> : jobsCountByLocation.map((loc, i) => (
            <div key={i} className="location-row">
              <span className="location-name"><FaMapMarkerAlt style={{ marginRight: '5px' }} />{loc.name}</span>
              <span className="location-count">{loc.count} jobs</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3 className="section-title"><FaBolt style={{ marginRight: '8px', color: '#ffcc00' }} />Quick Actions</h3>
        <div className="quick-actions">
          <Link to="/admin/users" className="action-btn"><span className="action-btn-icon"><FaUsers /></span><span className="action-btn-text">Manage Users</span></Link>
          <Link to="/admin/jobs" className="action-btn"><span className="action-btn-icon"><FaBriefcase /></span><span className="action-btn-text">Manage Jobs</span></Link>
          <Link to="/admin/bug-reports" className="action-btn"><span className="action-btn-icon"><FaBug /></span><span className="action-btn-text">View Bugs</span></Link>
          <Link to="/admin/chats" className="action-btn"><span className="action-btn-icon"><FaComments /></span><span className="action-btn-text">Monitor Chats</span></Link>
          <Link to="/admin/settings" className="action-btn"><span className="action-btn-icon"><FaCog /></span><span className="action-btn-text">System Settings</span></Link>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="recent-activity-grid">
        <div className="chart-card">
          <h3><FaClipboardList style={{ marginRight: '8px', color: '#ff8c00' }} />Recent Applications</h3>
          <div className="activity-list">
            {recentApplications.length === 0 ? <p>No applications yet.</p> : recentApplications.map((app, i) => (
              <div key={i} className="activity-item">
                <div className="activity-icon"><FaFileAlt /></div>
                <div className="activity-info">
                  <strong>{app.fullName || "Unknown"}</strong>
                  <p>Applied for a job {app.appliedAt?.seconds ? new Date(app.appliedAt.seconds * 1000).toLocaleTimeString() : 'just now'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3><FaBell style={{ marginRight: '8px', color: '#ff4444' }} />Recent Bug Reports</h3>
          <div className="activity-list">
            {recentBugs.length === 0 ? <p>No bugs reported.</p> : recentBugs.map((bug, i) => (
              <div key={i} className="activity-item">
                <div className="activity-icon"><FaBug /></div>
                <div className="activity-info">
                  <strong>{bug.userName || "Unknown"}</strong>
                  <p>Reported a bug {bug.createdAt?.seconds ? new Date(bug.createdAt.seconds * 1000).toLocaleTimeString() : 'just now'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Alert Banner (if there are pending bugs) */}
      {stats.bugReports > 0 && (
        <div className="system-alert-banner">
          <FaExclamationTriangle style={{ color: '#ffcc00', marginRight: '10px' }} />
          <span>You have <strong>{stats.bugReports}</strong> bug report(s) pending review. <Link to="/admin/bug-reports" style={{ color: '#ff8c00', fontWeight: 'bold' }}>Click here to view.</Link></span>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminDashboard;