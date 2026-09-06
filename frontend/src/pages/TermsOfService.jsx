import { Link } from "react-router-dom";
import { 
  FaFileContract, FaCheckCircle, FaInfoCircle, FaPhone, FaEnvelope, FaHome 
} from "react-icons/fa";

const TermsOfService = () => {
  return (
    <div className="legal-page-container">
      <div className="legal-card">
        <div className="legal-header">
          <div className="legal-icon"><FaFileContract /></div>
          <h1 className="legal-title">Terms of Service</h1>
          <p className="legal-updated">Last Updated: September 2026</p>
        </div>

        <div className="legal-content">
          <div className="legal-section">
            <div className="legal-section-icon"><FaInfoCircle /></div>
            <div>
              <h2>1. Acceptance of Terms</h2>
              <p>By accessing or using SkillNest, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon"><FaCheckCircle /></div>
            <div>
              <h2>2. User Responsibilities</h2>
              <p>As a user of SkillNest, you agree to:</p>
              <ul>
                <li>Provide accurate and truthful information in your profile.</li>
                <li>Not post illegal, harmful, or misleading content.</li>
                <li>Respect other users and engage in professional communication.</li>
                <li>Not misuse the platform for fraudulent activities.</li>
              </ul>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon"><FaInfoCircle /></div>
            <div>
              <h2>3. Job Postings & Applications</h2>
              <p>Employers are responsible for the accuracy of job postings. Job Seekers are responsible for the accuracy of their applications. We do not guarantee employment outcomes.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon"><FaInfoCircle /></div>
            <div>
              <h2>4. Intellectual Property</h2>
              <p>All content on SkillNest, including logos, text, and graphics, is the property of SkillNest and may not be reproduced without permission.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon"><FaInfoCircle /></div>
            <div>
              <h2>5. Termination</h2>
              <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-icon"><FaPhone /></div>
            <div>
              <h2>6. Contact Us</h2>
              <p>For questions about these Terms, contact us at:</p>
              <div className="legal-contact-info">
                <p><FaPhone /> 07089584607</p>
                <p><FaEnvelope /> support@skillnest.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="legal-footer">
          <Link to="/" className="btn btn-primary"><FaHome /> Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;