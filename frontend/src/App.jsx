import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { db } from "./firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { SettingsProvider } from "./context/SettingsContext";
import AppLayout from "./components/AppLayout";

// PUBLIC & AUTH PAGES
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login"; // <--- CRITICAL IMPORT
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

// APP PAGES
import Dashboard from "./pages/Dashboard";
import BrowseNeeds from "./pages/BrowseNeeds";
import PostNeed from "./pages/PostNeed";
import ApplyNow from "./pages/ApplyNow";
import Chat from "./pages/Chat";
import MyJobs from "./pages/MyJobs";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import SkillAssessment from "./pages/SkillAssessment";
import SavedAlerts from "./pages/SavedAlerts";
import ResumeBuilder from "./pages/ResumeBuilder";

// NEW PUBLIC PAGES
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import BugReport from "./components/BugReport";

// ADMIN PAGES
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminJobs from "./pages/AdminJobs";
import AdminBugReports from "./pages/AdminBugReports";
import AdminChats from "./pages/AdminChats";
import AdminApplications from "./pages/AdminApplications";
import AdminNotifications from "./pages/AdminNotifications";
import AdminSettings from "./pages/AdminSettings";

const LoadingScreen = () => (
  <div className="dashboard-loader">
    <div className="loader-spinner"></div>
    <p>Loading...</p>
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const HomeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" /> : <LandingPage />;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    const fetchRole = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setRole(querySnapshot.docs[0].data().role);
        } else {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) setRole(docSnap.data().role);
        }
      } catch (error) {
        console.error("Error checking role:", error);
      } finally {
        setChecking(false);
      }
    };
    fetchRole();
  }, [user]);

  if (loading || checking) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (role !== "admin") return <Navigate to="/dashboard" />;
  return children;
};

const NotFound = () => {
  return (
    <div className="auth-container">
      <div className="glass-card" style={{ textAlign: "center" }}>
        <h1 className="logo-text">404</h1>
        <p style={{ opacity: 0.7, marginBottom: "20px" }}>Oops! Page not found.</p>
        <Link to="/" className="btn btn-primary" style={{ textDecoration: "none", display: "block" }}>Go Home</Link>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<HomeRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />

            {/* PROTECTED USER ROUTES */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/browse" element={<ProtectedRoute><BrowseNeeds /></ProtectedRoute>} />
            <Route path="/post-need" element={<ProtectedRoute><PostNeed /></ProtectedRoute>} />
            <Route path="/apply/:needId" element={<ProtectedRoute><ApplyNow /></ProtectedRoute>} />
            <Route path="/chat/:chatId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/my-jobs" element={<ProtectedRoute><MyJobs /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/assessment" element={<ProtectedRoute><SkillAssessment /></ProtectedRoute>} />
            <Route path="/saved-alerts" element={<ProtectedRoute><SavedAlerts /></ProtectedRoute>} />
            <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />

            {/* ADMIN ROUTES */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/jobs" element={<AdminRoute><AdminJobs /></AdminRoute>} />
            <Route path="/admin/applications" element={<AdminRoute><AdminApplications /></AdminRoute>} />
            <Route path="/admin/bug-reports" element={<AdminRoute><AdminBugReports /></AdminRoute>} />
            <Route path="/admin/chats" element={<AdminRoute><AdminChats /></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

            {/* Catch-all → 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>

          <BugReport />
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;