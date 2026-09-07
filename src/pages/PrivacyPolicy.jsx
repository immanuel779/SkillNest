import { Link } from "react-router-dom";
import { FaShieldAlt, FaLock, FaUserShield, FaEnvelope, FaPhone } from "react-icons/fa";

const PrivacyPolicy = () => {
  return (
    <div className="legal-page-container">
      <div className="legal-card">
        <div className="legal-header">
          <div className="legal-icon"><FaShieldAlt /></div>
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-updated">Last Updated: September 2026</p>
        </div>

        <div className="legal-content">
          <div className="legal-section">
            <div className="legal-section-icon"><FaLock /></div>
            <div>
              <h2>1. Introduction</h2>
              <p>Welcome to SkillNest. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon"><FaUserShield /></div>
            <div>
              <h2>2. Information We Collect</h2>
              <p>We collect the following types of information:</p>
              <ul>
                <li><strong>Account Information:</strong> Name, email address, and role (Employer or Job Seeker).</li>
                <li><strong>Profile Information:</strong> Skills, experience, location, and resume links.</li>
                <li><strong>Usage Data:</strong> How you interact with our platform, including job applications and chats.</li>
              </ul>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon"><FaLock /></div>
            <div>
              <h2>3. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul>
                <li>Create and manage your account.</li>
                <li>Match you with relevant job opportunities or volunteers.</li>
                <li>Enable real-time chat between users.</li>
                <li>Send notifications about applications, messages, and platform updates.</li>
              </ul>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon"><FaLock /></div>
            <div>
              <h2>4. Data Security</h2>
              <p>We use industry-standard security measures (including Firebase Authentication and Firestore security rules) to protect your data from unauthorized access.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon"><FaEnvelope /></div>
            <div>
              <h2>5. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, contact us at:</p>
              <div className="legal-contact-info">
                <p><FaPhone /> 07089584607</p>
                <p><FaEnvelope /> support@skillnest.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="legal-footer">
          <Link to="/" className="btn btn-primary">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;