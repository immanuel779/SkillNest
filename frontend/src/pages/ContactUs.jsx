import { useState } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { 
  FaTwitter, FaInstagram, FaLinkedinIn, FaFacebookF, 
  FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, 
  FaPaperPlane, FaCheckCircle, FaExclamationTriangle, 
  FaUser, FaRegComments, FaQuestionCircle, FaHome 
} from "react-icons/fa";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get the user's current email if logged in
      const currentUserEmail = auth.currentUser?.email || formData.email;

      await addDoc(collection(db, "contact_messages"), {
        ...formData,
        userId: auth.currentUser?.uid || null,
        userEmail: currentUserEmail,
        createdAt: serverTimestamp(),
        status: "open"
      });
      
      setSent(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact Error:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      {/* Header */}
      <div className="contact-header">
        <div className="contact-header-content">
          <h1 className="contact-title">Get In Touch</h1>
          <p className="contact-subtitle">
            Questions, feedback, or partnership ideas? We're always ready to hear from you!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="contact-container">
        {/* Contact Info Sidebar */}
        <div className="contact-info-panel">
          <h3 className="panel-heading"><FaRegComments /> Contact Information</h3>
          
          <div className="contact-info-item">
            <div className="contact-info-icon"><FaPhoneAlt /></div>
            <div>
              <h4>Phone</h4>
              <a href="tel:+2347089584607">07089584607</a>
            </div>
          </div>

          <div className="contact-info-item">
            <div className="contact-info-icon"><FaEnvelope /></div>
            <div>
              <h4>Email</h4>
              <a href="mailto:support@skillnest.com">support@skillnest.com</a>
            </div>
          </div>

          <div className="contact-info-item">
            <div className="contact-info-icon"><FaMapMarkerAlt /></div>
            <div>
              <h4>Location</h4>
              <p>Lagos, Nigeria</p>
            </div>
          </div>

          <div className="contact-info-item">
            <div className="contact-info-icon"><FaClock /></div>
            <div>
              <h4>Working Hours</h4>
              <p>Mon - Fri: 9am - 6pm</p>
            </div>
          </div>

          <div className="contact-socials">
            <h4>Follow Us</h4>
            <div className="social-links">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon"><FaTwitter /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon"><FaInstagram /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon"><FaLinkedinIn /></a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon"><FaFacebookF /></a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form-panel">
          <h3 className="panel-heading"><FaPaperPlane /> Send Us A Message</h3>
          
          {sent && (
            <div className="success-alert" style={{ marginBottom: '20px' }}>
              <FaCheckCircle /> Message sent! We'll get back to you within 24 hours.
            </div>
          )}
          {error && (
            <div className="error-alert" style={{ marginBottom: '20px' }}>
              <FaExclamationTriangle /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label"><FaUser /> Full Name *</label>
                <input className="input-field" type="text" name="name" placeholder="Enter your full name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label"><FaEnvelope /> Email Address *</label>
                <input className="input-field" type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label"><FaPhoneAlt /> Phone (Optional)</label>
                <input className="input-field" type="tel" name="phone" placeholder="e.g. +234 801 234 5678" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input className="input-field" type="text" name="subject" placeholder="e.g. Partnership request" value={formData.subject} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Message *</label>
              <textarea className="input-field textarea-field" name="message" placeholder="Write your message here..." value={formData.message} onChange={handleChange} rows="6" required></textarea>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Sending..." : <><FaPaperPlane /> Send Message</>}
            </button>
          </form>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="contact-faq-section">
        <h2><FaQuestionCircle /> Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>How do I post a job?</h4>
            <p>Login as an Employer, go to the "Post a Need" page, and fill in the required details. Your job will be visible to all users instantly.</p>
          </div>
          <div className="faq-item">
            <h4>How do I find volunteers?</h4>
            <p>When you post a job, users can apply. You can then view their applications, chat with them, and accept or reject them.</p>
          </div>
          <div className="faq-item">
            <h4>Is SkillNest free?</h4>
            <p>Yes! SkillNest is 100% free to use for both employers and job seekers.</p>
          </div>
          <div className="faq-item">
            <h4>How do I reset my password?</h4>
            <p>Go to the login page and click "Forgot Password" to receive a reset link via email.</p>
          </div>
        </div>
      </div>

      {/* Back to Home */}
      <div className="contact-back-home">
        <Link to="/" className="btn btn-google" style={{ width: 'auto', padding: '12px 30px' }}>
          <FaHome /> Back to Home
        </Link>
      </div>
    </div>
  );
};

export default ContactUs;