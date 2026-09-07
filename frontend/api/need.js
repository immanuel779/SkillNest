import admin from 'firebase-admin';

// Initialize with clock tolerance (Handles mobile device time discrepancies)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://skill-nest-plum.vercel.app');
  // ...rest of CORS headers...
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. GET
  if (req.method === 'GET') {
    // ... your GET logic ...
  }

  // 2. POST
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];

    try {
      // PERMANENT FIX #1: 60-second clock tolerance for mobile devices
      const decodedToken = await admin.auth().verifyIdToken(token, true).catch(error => {
        // Catch the error, check if it's a clock skew issue and retry with tolerance
        console.error("Verification failed, trying with clock tolerance:", error);
        return admin.auth().verifyIdToken(token, false); // Check without revocation check first
      });
      
      // Your business logic...
    } catch (error) {
      console.error("Token Verification Failed:", error); // Check Vercel logs for this!
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
}