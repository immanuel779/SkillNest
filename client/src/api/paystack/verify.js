// client/api/paystack/verify.js
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin securely
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { reference, userId } = req.body;

  if (!reference || !userId) {
    return res.status(400).json({ error: 'Missing reference or userId' });
  }

  try {
    // 1. Verify with Paystack API
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // 2. Check if the amount paid is exactly 5,000 NGN (500,000 kobo)
    if (paystackData.data.amount < 500000) {
      return res.status(400).json({ error: 'Invalid amount paid' });
    }

    // 3. Update Firestore securely (bypassing client rules)
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      subscription: 'pro',
      isPremium: true,
      upgradedAt: new Date(),
      paystackRef: reference,
    });

    return res.status(200).json({ success: true, message: 'Pro subscription activated' });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}