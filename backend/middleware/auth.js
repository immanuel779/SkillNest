const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config();

const ALLOW_LOCAL_BYPASS = process.env.ALLOW_LOCAL_BYPASS === 'true';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = header.split(' ')[1];

    // 1. Strict check
    try {
      const decodedToken = await admin.auth().verifyIdToken(token, true);
      req.user = decodedToken;
      return next();
    } catch (strictError) {
      // 2. Retry with clock tolerance (60 seconds)
      try {
        const decodedToken = await admin.auth().verifyIdToken(token, false);
        const now = Math.floor(Date.now() / 1000);
        if (decodedToken.exp && decodedToken.exp < now - 60) {
          throw new Error('Token expired');
        }
        req.user = decodedToken;
        return next();
      } catch (toleranceError) {
        // 3. Local dev bypass only (never in production)
        if (ALLOW_LOCAL_BYPASS && !IS_PRODUCTION) {
          console.warn("⚠️ Using temporary bypass (LOCAL ONLY).");
          req.user = { uid: 'debug-user', email: 'debug@example.com' };
          return next();
        }
        console.error("AUTH VERIFICATION FAILED:", toleranceError.message);
        return res.status(401).json({ 
          error: 'Unauthorized - Token invalid or expired',
          hint: IS_PRODUCTION ? 'Please log in again.' : 'Check system clock.'
        });
      }
    }
  } catch (error) {
    console.error("AUTH ERROR:", error.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};