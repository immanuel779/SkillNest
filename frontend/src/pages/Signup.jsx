import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useSettings } from "../context/SettingsContext";
import { FaEye, FaEyeSlash, FaUser, FaLock, FaBuilding } from "react-icons/fa";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [organization, setOrganization] = useState(""); // Future Tool: Show if Employer
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { settings } = useSettings(); // Get Global Settings

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    // ✅ Check Allow Signups
    if (!settings.platform.allowSignups) {
      setError("New signups are currently disabled. Please contact the admin team.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      setError("You must agree to the Terms and Conditions.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: role,
        organizationName: role === 'employer' ? organization : "", // Save org if employer
        agreedToTerms: true,
        createdAt: new Date()
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="water-drop" style={{ left: '20%', width: '90px', height: '90px', animationDelay: '3s' }}></div>
      <div className="glow-orb" style={{ top: '20%', left: '20%' }}></div>
      
      <div className="glass-card">
        <div className="auth-avatar"><FaUser size={40} color="#ff8c00" /></div>
        <h1 className="logo-text">SkillNest</h1>
        <p style={{ textAlign: "center", opacity: 0.7, marginBottom: "20px" }}>Create your account</p>

        {error && <div className="error-alert">❌ {error}</div>}

        <div className="role-selector">
          <button type="button" className={`role-btn ${role === 'employee' ? 'active' : ''}`} onClick={() => setRole('employee')}>💼 Job Seeker</button>
          <button type="button" className={`role-btn ${role === 'employer' ? 'active' : ''}`} onClick={() => setRole('employer')}>🏢 Employer</button>
        </div>

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <input className="input-field" type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {/* Future Tool: Organization Name only shows for Employers */}
          {role === 'employer' && (
            <div className="form-group">
              <div className="input-icon-wrapper">
                <FaBuilding style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#ff8c00' }} />
                <input className="input-field" style={{ paddingLeft: '35px' }} type="text" placeholder="Organization Name" value={organization} onChange={(e) => setOrganization(e.target.value)} required />
              </div>
            </div>
          )}

          <div className="form-group">
            <input className="input-field" type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group password-wrapper">
            <input className="input-field" type={showPassword ? 'text' : 'password'} placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
          </div>

          <div className="form-group password-wrapper">
            <input className="input-field" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <button type="button" className="eye-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</button>
          </div>

          <div className="terms-checkbox">
            <label className="checkbox-label">
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
              <span className="checkbox-text">I agree with the <a href="/terms" target="_blank" rel="noopener noreferrer" className="brand-link">Terms & Conditions</a></span>
            </label>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "15px", fontSize: "0.9rem", color: "#ccc" }}>
          Already have an account? <Link to="/login" className="brand-link">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;