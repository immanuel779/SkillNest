import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useSettings } from "../context/SettingsContext";
import { FaEye, FaEyeSlash, FaUser, FaLock, FaCheckCircle } from "react-icons/fa";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [rememberMe, setRememberMe] = useState(true); // Future Tool
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { settings } = useSettings(); // Get Global Settings

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // ✅ Check Maintenance Mode
    if (settings.platform.maintenance) {
      setError("Platform is currently under maintenance. Please try again later.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let userData = null;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        const q = query(collection(db, "users"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) userData = querySnapshot.docs[0].data();
      }

      if (!userData) {
        await auth.signOut();
        setError("User profile not found. Please sign up again.");
        setLoading(false);
        return;
      }

      const accountRole = userData.role;
      if (accountRole === "admin") {
        navigate("/admin");
        return;
      }
      if (accountRole !== role) {
        await auth.signOut();
        setError(`Strict Access Control: You cannot login as ${role}.`);
        setLoading(false);
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="water-drop" style={{ left: '10%', width: '80px', height: '80px', animationDelay: '0s' }}></div>
      <div className="water-drop" style={{ right: '10%', width: '60px', height: '60px', animationDelay: '8s' }}></div>
      <div className="glow-orb" style={{ top: '-50px', left: '-50px' }}></div>
      <div className="glow-orb" style={{ bottom: '-50px', right: '-50px', animationDelay: '2s' }}></div>

      <div className="glass-card">
        <div className="auth-avatar"><FaUser size={40} color="#ff8c00" /></div>
        <h1 className="logo-text">SkillNest</h1>
        <p style={{ textAlign: "center", opacity: 0.7, marginBottom: "20px" }}>Login to continue</p>

        {error && <div className="error-alert">❌ {error}</div>}

        <div className="role-selector">
          <button type="button" className={`role-btn ${role === 'employee' ? 'active' : ''}`} onClick={() => setRole('employee')}>💼 Job Seeker</button>
          <button type="button" className={`role-btn ${role === 'employer' ? 'active' : ''}`} onClick={() => setRole('employer')}>🏢 Employer</button>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <input className="input-field" type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group password-wrapper">
            <input className="input-field" type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          {/* Future Tool: Remember Me */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} id="rememberMe" />
            <label htmlFor="rememberMe" style={{ color: '#ccc', cursor: 'pointer' }}>Remember Me</label>
          </div>

          <div style={{ textAlign: "right", marginBottom: "15px" }}>
            <Link to="/forgot-password" className="brand-link">Forgot Password?</Link>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        <div className="auth-divider">Or</div>
        <p style={{ textAlign: "center", marginTop: "10px", fontSize: "0.9rem", color: "#ccc" }}>
          Don't have an account? <Link to="/signup" className="brand-link">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;