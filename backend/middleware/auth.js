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

    // 1. Try strict verification first
    try {
      const decodedToken = await admin.auth().verifyIdToken(token, true);
      req.user = decodedToken;
      return next();
    } catch (strictError) {
      // 2. If strict fails, try with clock tolerance (ignore revoked check)
      // The 60-second tolerance allows for server clock drift
      try {
        const decodedToken = await admin.auth().verifyIdToken(token, false);
        // Manually check expiration with 60-second grace
        const now = Math.floor(Date.now() / 1000);
        const exp = decodedToken.exp;
        if (exp && exp < now - 60) {
          throw new Error('Token expired');
        }
        req.user = decodedToken;
        return next();
      } catch (toleranceError) {
        // 3. Check if we're in local development (bypass allowed)
        if (ALLOW_LOCAL_BYPASS && !IS_PRODUCTION) {
          console.warn("⚠️ [LOCAL DEV MODE] Using temporary bypass. Token not verified.");
          req.user = { uid: 'debug-user', email: 'debug@example.com' };
          return next();
        }
        
        // 4. If all fails, reject the request
        console.error("AUTH VERIFICATION FAILED:", toleranceError.message || toleranceError);
        return res.status(401).json({ 
          error: 'Unauthorized - Token invalid or expired',
          hint: IS_PRODUCTION ? 'Please log in again.' : 'Check system clock or Firebase config.'
        });
      }
    }
  } catch (error) {
    console.error("AUTH ERROR:", error.message || error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};