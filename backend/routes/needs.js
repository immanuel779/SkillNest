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

    // ✅ FIXED: Properly wait for alerts to send (using for...of)
    try {
      const alertsSnapshot = await db.collection('alerts').get();
      for (const alertDoc of alertsSnapshot.docs) {
        const alert = alertDoc.data();
        if (alert.skill && alert.skill.toLowerCase() === skillRequired.toLowerCase()) {
          await sendNotification(alert.userId, null, `🔥 New Job Alert: ${title}`, `A new job matching your saved alert for "${skillRequired}" has been posted!`, 'job');
          const userDoc = await db.collection('users').doc(alert.userId).get();
          if (userDoc.exists && userDoc.data().email) {
            await sendJobAlertEmail(userDoc.data().email, title, organizationName);
          }
        }
      }
    } catch (alertError) { console.error("Error sending alerts:", alertError); }

    res.status(201).json({ id: docRef.id, ...newNeed });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Apply to a need (requires auth) - 🔥 CRITICAL FIX APPLIED HERE
router.post('/:id/apply', authMiddleware, async (req, res) => {
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

    // 🔥 FIXED: Wrap notification/email in try/catch so it NEVER stops the response
    try {
      const employerEmail = (await db.collection('users').doc(needData.createdBy).get()).data()?.email;
      await sendNotification(needData.createdBy, employerEmail, 'New Application Received! 🎉', `${fullName} applied for "${needData.title}".`, 'application');
    } catch (notifError) {
      console.error("Notification failed but chat created:", notifError);
    }

    // ✅ THIS MUST ALWAYS HAPPEN: Return the chatId so the frontend can direct the user!
    res.status(200).json({ message: 'Application submitted successfully', chatId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// DELETE a need (Employer only)
router.delete('/:id', authMiddleware, async (req, res) => {
  const needId = req.params.id;
  try {
    const needDoc = await db.collection('needs').doc(needId).get();
    if (!needDoc.exists) return res.status(404).json({ error: 'Job not found' });
    if (needDoc.data().createdBy !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });
    await db.collection('needs').doc(needId).delete();
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET all applications for a job (Employer only)
router.get('/:id/applications', authMiddleware, async (req, res) => {
  const needId = req.params.id;
  try {
    const needDoc = await db.collection('needs').doc(needId).get();
    if (!needDoc.exists) return res.status(404).json({ error: 'Job not found' });
    if (needDoc.data().createdBy !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });

    const appsSnapshot = await db.collection('applications').where('needId', '==', needId).get();
    res.status(200).json(appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// UPDATE Application Status (Employer only)
router.put('/applications/:appId/status', authMiddleware, async (req, res) => {
  const appId = req.params.appId;
  const { status } = req.body;
  try {
    const appDoc = await db.collection('applications').doc(appId).get();
    if (!appDoc.exists) return res.status(404).json({ error: 'Application not found' });

    const appData = appDoc.data();
    const needDoc = await db.collection('needs').doc(appData.needId).get();
    if (needDoc.data().createdBy !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });

    await db.collection('applications').doc(appId).update({ status });
    res.status(200).json({ message: 'Status updated' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;