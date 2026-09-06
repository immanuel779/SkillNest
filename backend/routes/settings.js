const express = require('express');
const router = express.Router();
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

// GET ALL SETTINGS
router.get('/', async (req, res) => {
  try {
    const platformDoc = await db.collection('settings').doc('platform').get();
    const notifDoc = await db.collection('settings').doc('notifications').get();

    const platform = platformDoc.exists ? platformDoc.data() : { 
      maintenance: false, allowSignups: true, allowPostings: true, allowApplications: true, allowChats: true, 
      // NEW FEATURES
      systemName: "SkillNest",
      forceEmailVerification: false,
      requireAdminApproval: false,
      autoBlockScams: false,
      globalAnnouncement: "",
      globalAnnouncementEnabled: false
    };
    const notifications = notifDoc.exists ? notifDoc.data() : { emailAlerts: true, pushAlerts: true, inAppAlerts: true, autoCleanup: false };

    res.status(200).json({ platform, notifications });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE SETTINGS (Saves instantly, no 401 errors for local dev)
router.put('/', async (req, res) => {
  const { platform, notifications } = req.body;
  try {
    if (platform) {
      // Clean the platform object to prevent bad data
      const cleanPlatform = {
        maintenance: !!platform.maintenance,
        allowSignups: !!platform.allowSignups,
        allowPostings: !!platform.allowPostings,
        allowApplications: !!platform.allowApplications,
        allowChats: !!platform.allowChats,
        systemName: platform.systemName || "SkillNest",
        forceEmailVerification: !!platform.forceEmailVerification,
        requireAdminApproval: !!platform.requireAdminApproval,
        autoBlockScams: !!platform.autoBlockScams,
        globalAnnouncement: platform.globalAnnouncement || "",
        globalAnnouncementEnabled: !!platform.globalAnnouncementEnabled
      };
      await db.collection('settings').doc('platform').set(cleanPlatform, { merge: true });
    }

    if (notifications) {
      const cleanNotif = {
        emailAlerts: !!notifications.emailAlerts,
        pushAlerts: !!notifications.pushAlerts,
        inAppAlerts: !!notifications.inAppAlerts,
        autoCleanup: !!notifications.autoCleanup
      };
      await db.collection('settings').doc('notifications').set(cleanNotif, { merge: true });
    }

    const savedPlatformDoc = await db.collection('settings').doc('platform').get();
    const savedNotifDoc = await db.collection('settings').doc('notifications').get();

    res.status(200).json({ 
      platform: savedPlatformDoc.exists ? savedPlatformDoc.data() : platform, 
      notifications: savedNotifDoc.exists ? savedNotifDoc.data() : notifications 
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;