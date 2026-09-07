import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link sent! Check your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="water-drop" style={{ left: '20%', width: '90px', height: '90px', animationDelay: '3s' }}></div>
      <div className="glow-orb" style={{ top: '20%', right: '20%' }}></div>

      <div className="glass-card">
        <div className="auth-avatar">🔑</div>
        <h1 className="logo-text">SkillNest</h1>
        <p style={{ textAlign: "center", opacity: 0.7, marginBottom: "20px" }}>Reset Password</p>
        <p style={{ textAlign: "center", opacity: 0.7, marginBottom: "20px" }}>Enter your email to receive a reset link.</p>

        {message && <div className="error-alert" style={{ background: "rgba(0, 255, 136, 0.2)", borderColor: "#00ff88", color: "#00ff88" }}>✅ {message}</div>}
        {error && <div className="error-alert">❌ {error}</div>}

        <form onSubmit={handleReset}>
          <div className="form-group">
            <input className="input-field" type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="auth-divider">Or</div>

        <p style={{ textAlign: "center", marginTop: "10px", fontSize: "0.9rem", color: "#ccc" }}>
          Remembered it? <Link to="/login" className="brand-link">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;