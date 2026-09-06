const nodemailer = require('nodemailer');
// ✅ FIX: Use modular SDK for Firestore
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// =========================================
// EMAIL TRANSPORTER
// =========================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

const sendEmail = async (to, subject, text, html = null) => {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('⚠️ GMAIL credentials not set. Skipping email.');
      return;
    }
    const mailOptions = {
      from: 'SkillNest <' + process.env.GMAIL_USER + '>',
      to,
      subject,
      text
    };
    if (html) mailOptions.html = html;
    await transporter.sendMail(mailOptions);
    console.log('📧 Email sent to:', to);
  } catch (err) {
    console.error('Email error:', err.message || err);
  }
};

const sendPush = async (userId, title, body) => {
  try {
    // ✅ FIX: Use getFirestore() directly (no admin.firestore)
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists && userDoc.data().fcmToken) {
      await admin.messaging().send({
        token: userDoc.data().fcmToken,
        notification: { title, body }
      });
      console.log('🔔 Push sent:', userId);
    }
  } catch (err) {
    if (err.code === 'messaging/registration-token-not-registered') {
      console.warn('Invalid FCM token removed for:', userId);
      try {
        const db = getFirestore();
        await db.collection('users').doc(userId).update({ fcmToken: FieldValue.delete() });
      } catch (e) {}
    } else {
      console.error('Push error:', err.message || err);
    }
  }
};

const sendNotification = async (userId, email, title, text, type = 'update') => {
  try {
    const db = getFirestore();
    await db.collection('notifications').add({
      recipientId: userId, title, message: text, type, read: false, createdAt: FieldValue.serverTimestamp()
    });
    await sendPush(userId, title, text);
    if (email) await sendEmail(email, title, text);
  } catch (err) { console.error('Notif error:', err.message || err); }
};

module.exports = { sendEmail, sendPush, sendNotification };