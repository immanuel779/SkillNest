import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import {
  multiFactor,
  PhoneMultiFactorGenerator,
  PhoneAuthProvider,
  RecaptchaVerifier
} from "firebase/auth";
import { 
  FaPhone, FaShieldAlt, FaCheckCircle, FaExclamationTriangle, 
  FaSpinner, FaLock, FaCommentDots 
} from "react-icons/fa";

const TwoFAEnrollModal = ({ onClose, onEnrolled }) => {
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState(1); // 1: phone, 2: code
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Cleanup Recaptcha on unmount
  useEffect(() => {
    return () => {
      try {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      } catch (e) {}
    };
  }, []);

  // Countdown for resend code
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Initialize Recaptcha (single instance)
  const getRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {}
      });
    }
    return window.recaptchaVerifier;
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const recaptcha = getRecaptcha();
      const multiFactorSession = await multiFactor(auth.currentUser).getSession();
      const phoneAuthProvider = new PhoneAuthProvider();
      const id = await phoneAuthProvider.verifyPhoneNumber(phone, recaptcha);
      
      setVerificationId(id);
      setStep(2);
      setResendTimer(30); // 30-second countdown
    } catch (err) {
      setError(err.message);
      // Reset recaptcha on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
      
      await multiFactor(auth.currentUser).enroll(multiFactorAssertion, 'Phone Number');
      
      // Save 2FA state to Firestore
      await setDoc(doc(db, "users", auth.currentUser.uid), { twoFA: true }, { merge: true });
      
      setSuccess(true);
      setTimeout(() => {
        onEnrolled();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError(null);
    try {
      const recaptcha = getRecaptcha();
      const multiFactorSession = await multiFactor(auth.currentUser).getSession();
      const phoneAuthProvider = new PhoneAuthProvider();
      const id = await phoneAuthProvider.verifyPhoneNumber(phone, recaptcha);
      setVerificationId(id);
      setResendTimer(30);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Success State */}
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <FaCheckCircle size={60} color="#00ff88" style={{ marginBottom: '15px' }} />
            <h3>2FA Enabled Successfully!</h3>
            <p style={{ opacity: 0.8 }}>Your account is now protected.</p>
          </div>
        ) : (
          <>
            <div className="modal-header" style={{ justifyContent: 'center', marginBottom: '10px' }}>
              <h3><FaShieldAlt style={{ color: '#ff8c00', marginRight: '10px' }} /> Enable 2FA</h3>
            </div>
            
            {error && <div className="error-alert"><FaExclamationTriangle style={{ marginRight: '8px' }} /> {error}</div>}
            
            {step === 1 && (
              <form onSubmit={handleSendCode}>
                <div className="form-group">
                  <label className="form-label"><FaPhone style={{ marginRight: '8px' }} /> Enter Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input-field"
                      type="tel"
                      placeholder="+2348012345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '8px' }}>We'll send a 6-digit verification code via SMS.</p>
                </div>
                {/* Recaptcha container */}
                <div id="recaptcha-container"></div>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? <><FaSpinner className="spin" /> Sending...</> : <><FaCommentDots /> Send Verification Code</>}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyCode}>
                <div className="form-group">
                  <label className="form-label"><FaLock style={{ marginRight: '8px' }} /> Enter 6-digit Code</label>
                  <input
                    className="input-field"
                    type="text"
                    maxLength="6"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Didn't receive code?</p>
                    <button 
                      type="button" 
                      onClick={handleResend} 
                      disabled={resendTimer > 0}
                      style={{ background: 'none', border: 'none', color: '#ff8c00', cursor: resendTimer > 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? <><FaSpinner className="spin" /> Verifying...</> : 'Verify & Enable 2FA'}
                </button>
              </form>
            )}

            <button className="btn btn-google" style={{ marginTop: '10px' }} onClick={onClose}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TwoFAEnrollModal;