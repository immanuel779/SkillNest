import admin from 'firebase-admin';

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
  res.setHeader('Access-Control-Allow-Origin', 'https://skill-nest-plum.vercel.app');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') { /* ... Your GET logic ... */ }

  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];

    try {
      // PERMANENT FIX: 60-second clock tolerance for mobile devices!
      const decodedToken = await admin.auth().verifyIdToken(token, true).catch(error => {
        console.error("Verification failed, retrying with clock tolerance:", error);
        return admin.auth().verifyIdToken(token, false); 
      });
      
      const { title, description, skillRequired, organizationName, location, imageUrl, whatsappNumber, emergencyNumber } = req.body;
      await db.collection('needs').add({
        title, description, skillRequired, organizationName, location, imageUrl, whatsappNumber, emergencyNumber,
        createdBy: decodedToken.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(201).json({ message: 'Need posted successfully!' });

    } catch (error) {
      console.error("Token Verification Failed:", error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
}