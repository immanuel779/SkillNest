const admin = require('firebase-admin');

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = header.split(' ')[1];

    // 1. Use verifyIdToken(token, false) to ignore clock drift
    const decodedToken = await admin.auth().verifyIdToken(token, false);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("AUTH ERROR:", error.message);
    return res.status(401).json({ error: 'Unauthorized - Token invalid' });
  }
};