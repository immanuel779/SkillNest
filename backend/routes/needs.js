const express = require('express');
const router = express.Router();
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const authMiddleware = require('../middleware/auth');
const { sendEmail, sendPush, sendNotification, sendStatusUpdateEmail, sendJobAlertEmail } = require('../utils/email');

const db = getFirestore();

// Helper to check admin settings
const checkSetting = async (key) => {
  try {
    const doc = await db.collection('settings').doc('platform').get();
    if (doc.exists) return doc.data()[key] !== false; // Default to true if missing
    return true;
  } catch (e) {
    console.error("Error checking settings:", e);
    return true;
  }
};

// GET all needs (public)
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('needs').get();
    const needs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(needs);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST a new need (requires auth)
router.post('/', authMiddleware, async (req, res) => {
  // 🔒 BACKEND ENFORCEMENT: Block postings if disabled
  if (!(await checkSetting('allowPostings'))) {
    return res.status(403).json({ error: 'Job postings are currently disabled by the admin.' });
  }

  const { title, description, skillRequired, organizationName, location, imageUrl, whatsappNumber, emergencyNumber } = req.body;
  if (!title || !skillRequired) return res.status(400).json({ error: 'Title and skill required' });

  try {
    const employerDoc = await db.collection('users').doc(req.user.uid).get();
    const employerData = employerDoc.exists ? employerDoc.data() : {};

    const newNeed = {
      title, description, skillRequired, organizationName, location,
      imageUrl: imageUrl || "", whatsappNumber: whatsappNumber || "", emergencyNumber: emergencyNumber || "",
      createdBy: req.user.uid,
      verifiedOrg: employerData.verifiedOrg || false,
      createdAt: FieldValue.serverTimestamp(),
      status: 'open'
    };
    const docRef = await db.collection('needs').add(newNeed);

    try {
      const alertsSnapshot = await db.collection('alerts').get();
      alertsSnapshot.forEach(async (alertDoc) => {
        const alert = alertDoc.data();
        if (alert.skill && alert.skill.toLowerCase() === skillRequired.toLowerCase()) {
          await sendNotification(alert.userId, null, `🔥 New Job Alert: ${title}`, `A new job matching your saved alert for "${skillRequired}" has been posted!`, 'job');
          const userDoc = await db.collection('users').doc(alert.userId).get();
          if (userDoc.exists && userDoc.data().email) {
            await sendJobAlertEmail(userDoc.data().email, title, organizationName);
          }
        }
      });
    } catch (alertError) { console.error("Error sending alerts:", alertError); }

    res.status(201).json({ id: docRef.id, ...newNeed });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Apply to a need (requires auth)
router.post('/:id/apply', authMiddleware, async (req, res) => {
  // 🔒 BACKEND ENFORCEMENT: Block applications if disabled
  if (!(await checkSetting('allowApplications'))) {
    return res.status(403).json({ error: 'Applications are currently disabled by the admin.' });
  }

  const needId = req.params.id;
  const volunteerId = req.user.uid;
  const { fullName, phone, location, resumeUrl, expectedSalary, startDate, coverLetter, experience, portfolio } = req.body;

  try {
    const needDoc = await db.collection('needs').doc(needId).get();
    if (!needDoc.exists) return res.status(404).json({ error: 'Job not found' });
    const needData = needDoc.data();

    await db.collection('needs').doc(needId).update({ applicants: FieldValue.arrayUnion(volunteerId) });
    await db.collection('applications').add({
      needId, volunteerId, fullName, phone, location, resumeUrl,
      expectedSalary, startDate, coverLetter, experience, portfolio,
      appliedAt: FieldValue.serverTimestamp(), status: 'pending'
    });

    let chatId;
    const chatsSnapshot = await db.collection('chats').get();
    let existingChat = null;
    chatsSnapshot.forEach(doc => { if (doc.data().needId === needId && doc.data().participants.includes(volunteerId)) existingChat = doc; });
    if (existingChat) chatId = existingChat.id;
    else {
      const chatRef = await db.collection('chats').add({ needId, participants: [volunteerId, needData.createdBy], lastMessage: '', updatedAt: FieldValue.serverTimestamp() });
      chatId = chatRef.id;
    }

    const employerEmail = (await db.collection('users').doc(needData.createdBy).get()).data()?.email;
    await sendNotification(needData.createdBy, employerEmail, 'New Application Received! 🎉', `${fullName} applied for "${needData.title}".`, 'application');

    res.status(200).json({ message: 'Application submitted successfully', chatId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ... (Keep the DELETE, GET applications, and STATUS routes exactly as they are) ...
module.exports = router;