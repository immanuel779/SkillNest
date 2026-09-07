import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// UPDATED IMPORTS - Added all icons
import { FaTwitter, FaInstagram, FaLinkedinIn, FaFacebookF, FaBriefcase, FaBolt, FaComments, FaBell, FaHeart } from "react-icons/fa";

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      {/* NAVIGATION */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <img src="/skillnest-icon.jpeg" alt="SkillNest" className="landing-logo-img" />
          <h1>SkillNest</h1>
        </div>
        <div className="landing-nav-links">
          <a href="#features" className="landing-link">Features</a>
          <a href="#how-it-works" className="landing-link">How It Works</a>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ width: 'auto', padding: '10px 25px' }}>Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-google" style={{ width: 'auto', padding: '10px 25px' }}>Login</Link>
              <Link to="/signup" className="btn btn-primary" style={{ width: 'auto', padding: '10px 25px' }}>Sign Up Free</Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Your Skills Can Change <span className="gradient-text">The Community</span>
          </h1>
          <p className="hero-subtitle">
            SkillNest connects skilled volunteers with non-profits, schools, and small businesses. 
            Showcase your talent, find meaningful work, and make a real impact.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary" style={{ width: 'auto', padding: '15px 35px', fontSize: '1.1rem' }}>
              Get Started Free
            </Link>
            <Link to="/browse" className="btn btn-google" style={{ width: 'auto', padding: '15px 35px', fontSize: '1.1rem' }}>
              Browse Opportunities
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="/skillnest-icon.jpeg" alt="SkillNest Hero" className="hero-logo-big" />
        </div>
      </section>

      {/* FEATURES SECTION - UPGRADED ICONS */}
      <section id="features" className="features-section">
        <h2 className="section-heading">Why Choose SkillNest?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><FaBriefcase /></div>
            <h3>Find Real Opportunities</h3>
            <p>Browse jobs and volunteer gigs from trusted organizations in your community.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FaBolt /></div>
            <h3>Showcase Your Skills</h3>
            <p>Create a profile, add your skills, and let organizations find you.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FaComments /></div>
            <h3>Real-Time Chat</h3>
            <p>Communicate directly with employers through our secure, real-time chat system.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FaBell /></div>
            <h3>Instant Notifications</h3>
            <p>Get notified instantly when someone applies, messages you, or accepts your application.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="how-it-works-section">
        <h2 className="section-heading">How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Create Your Account</h3>
            <p>Sign up as an Employer or Job Seeker in just 30 seconds.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Build Your Profile</h3>
            <p>Add your skills, experience, and resume so others can find you.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Apply & Chat</h3>
            <p>Browse opportunities, apply with confidence, and chat with employers.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Make an Impact</h3>
            <p>Get accepted, start working, and make a real difference in your community.</p>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="stats-section">
        <div className="stat-box">
          <h2>500+</h2>
          <p>Skills Shared</p>
        </div>
        <div className="stat-box">
          <h2>100+</h2>
          <p>Opportunities Posted</p>
        </div>
        <div className="stat-box">
          <h2>50+</h2>
          <p>Organizations</p>
        </div>
        <div className="stat-box">
          <h2>1000+</h2>
          <p>Community Members</p>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <h2>Ready to Make a Difference?</h2>
        <p>Join SkillNest today and start using your skills for good.</p>
        <Link to="/signup" className="btn btn-primary" style={{ width: 'auto', padding: '15px 35px', fontSize: '1.1rem' }}>
          Join Now - It's Free!
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-logo">
              <img src="/skillnest-icon.jpeg" alt="SkillNest" className="footer-logo-img" />
              <h2>SkillNest</h2>
            </div>
            <p className="footer-desc">
              Connecting skilled volunteers with organizations that need them most. Build your portfolio, help your community, and grow together.
            </p>
           
<div className="footer-socials">
  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-social-icon"><FaTwitter /></a>
  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-icon"><FaInstagram /></a>
  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-social-icon"><FaLinkedinIn /></a>
  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-icon"><FaFacebookF /></a>
</div>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><Link to="/browse">Browse Opportunities</Link></li>
              <li><Link to="/signup">Sign Up</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Support</h4>
            <ul className="footer-links">
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service">Terms of Service</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Stay Updated</h4>
            <p className="footer-desc">Get the latest community opportunities straight to your inbox.</p>
            <div className="footer-newsletter-form">
              <input type="email" placeholder="Enter your email" className="footer-newsletter-input" />
              <button className="footer-newsletter-btn">Subscribe</button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          © 2026 SkillNest. All rights reserved. Built with <FaHeart style={{ color: '#ff8c00', verticalAlign: 'middle', margin: '0 5px' }} /> for the community.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;