const admin = require('firebase-admin');

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = header.split(' ')[1];

    // 1. Try strict (but no time check – we ignore clock drift)
    const decodedToken = await admin.auth().verifyIdToken(token, false);
    req.user = decodedToken;
    next();
    
  } catch (error) {
    // 2. If it still fails, log the error for us to see
    console.error("AUTH ERROR:", error.message);
    return res.status(401).json({ error: 'Unauthorized - Token invalid' });
  }
};