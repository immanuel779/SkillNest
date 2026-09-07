const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config();

const ALLOW_LOCAL_BYPASS = process.env.ALLOW_LOCAL_BYPASS === 'true';

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = header.split(' ')[1];

    // 1. THE MAGIC FIX: If bypass is enabled in Render, ignore token validation completely.
    if (ALLOW_LOCAL_BYPASS) {
      console.warn("⚠️ [BYPASS] Skipping token verification (Debug Mode).");
      req.user = { uid: 'debug-user', email: 'debug@example.com' };
      return next();
    }

    // 2. If bypass is disabled (production), use strict token check.
    const decodedToken = await admin.auth().verifyIdToken(token, false);
    req.user = decodedToken;
    next();
    
  } catch (error) {
    console.error("AUTH ERROR:", error.message);
    return res.status(401).json({ error: 'Unauthorized - Token invalid' });
  }
};