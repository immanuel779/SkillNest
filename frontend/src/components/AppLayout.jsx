import { useState, useEffect } from "react"; // Added useEffect
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import { 
  FaHome, FaBriefcase, FaPlusCircle, FaFolderOpen, FaComments, 
  FaUserCog, FaShieldAlt, FaBars, FaSignOutAlt, FaChartLine, 
  FaUsers, FaBug, FaBell, FaCog, FaFileAlt 
} from "react-icons/fa";

const AppLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, logout } = useAuth();

  // Premium UX: Close sidebar on Escape key and prevent background scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsSidebarOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isSidebarOpen]);

  const userLinks = [
    { to: "/dashboard", icon: <FaHome />, label: "Dashboard" },
    { to: "/browse", icon: <FaBriefcase />, label: "Browse Needs" },
    { to: "/post-need", icon: <FaPlusCircle />, label: "Post Need" },
    { to: "/my-jobs", icon: <FaFolderOpen />, label: "My Jobs" },
    { to: "/messages", icon: <FaComments />, label: "Messages" },
    { to: "/profile", icon: <FaUserCog />, label: "Profile" }
  ];
  if (isAdmin) userLinks.push({ to: "/admin", icon: <FaShieldAlt />, label: "Admin Panel" });

  const adminLinks = [
    { to: "/admin", icon: <FaChartLine />, label: "Overview" },
    { to: "/admin/users", icon: <FaUsers />, label: "Users" },
    { to: "/admin/jobs", icon: <FaBriefcase />, label: "Jobs" },
    { to: "/admin/applications", icon: <FaFileAlt />, label: "Applications" },
    { to: "/admin/bug-reports", icon: <FaBug />, label: "Bug Reports" },
    { to: "/admin/chats", icon: <FaComments />, label: "Chats" },
    { to: "/admin/notifications", icon: <FaBell />, label: "Notifications" },
    { to: "/admin/settings", icon: <FaCog />, label: "Settings" },
    { to: "/dashboard", icon: <FaHome />, label: "Back to App" }
  ];

  const isAdminRoute = location.pathname.startsWith("/admin");
  const currentLinks = isAdminRoute ? adminLinks : userLinks;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="dashboard-layout">
      {/* MOBILE CLICK-OUTSIDE OVERLAY */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <h2 className="logo-gradient">SkillNest</h2>
        <nav className="sidebar-nav">
          {currentLinks.map(link => (
            <Link 
              key={link.to} 
              to={link.to} 
              className={`sidebar-link ${location.pathname === link.to ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              {link.icon} <span>{link.label}</span>
            </Link>
          ))}
        </nav>
        {/* LOGOUT BUTTON */}
        <div className="sidebar-footer">
          <button className="logout-btn-sidebar" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        {/* TOP BAR - HAMBURGER AND BELL HERE (Scrolls with page) */}
        <div className="top-bar-header">
          <button 
            className="hamburger-btn" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle Sidebar"
          >
            <FaBars />
          </button>
          <NotificationBell />
        </div>
        
        {children}
      </div>
    </div>
  );
};

export default AppLayout;