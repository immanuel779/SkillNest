const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config(); // Load .env variables

// =========================================
// CONFIG: Enable local bypass ONLY if specified
// =========================================
const ALLOW_LOCAL_BYPASS = process.env.ALLOW_LOCAL_BYPASS === 'true';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = header.split(' ')[1];

    // 🔹 1. ALWAYS try to verify the real Firebase token first
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();

  } catch (error) {
    // ====== LOG THE FULL ERROR FOR DEBUGGING ======
    console.error("============================================");
    console.error("AUTH VERIFICATION FAILED");
    console.error(error.message || error);
    console.error("============================================");

    // 🔹 2. LOCAL DEVELOPMENT BYPASS (ONLY if explicitly enabled!)
    if (ALLOW_LOCAL_BYPASS && !IS_PRODUCTION) {
      console.warn("⚠️   [LOCAL DEV MODE] Using temporary bypass. Token not verified.");
      console.warn("⚠️   Remove ALLOW_LOCAL_BYPASS=true in .env before deploying!");
      req.user = { uid: 'debug-user', email: 'debug@example.com' };
      return next();
    }

    // 🔹 3. If we're in production or bypass is disabled, reject the request
    return res.status(401).json({ 
      error: 'Unauthorized - Token invalid or expired',
      hint: IS_PRODUCTION ? 'Please log in again.' : 'Check system clock or Firebase config.'
    });
  }
};