const { sendEmail, sendPush, sendNotification } = require('./utils/email');
const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

// =========================================
// ✅ Read Firebase Config for Render/Local
// =========================================
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    serviceAccount = require('./serviceAccountKey.json');
  }
} catch (error) {
  console.error("Fatal Error: Firebase service account could not be loaded.");
  console.error(error);
  process.exit(1);
}

const adminApp = initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

const app = express();

// =========================================
// ✅ UPDATED CORS (Your Vercel URL + Local)
// =========================================
const allowedOrigins = [
  "http://localhost:5173",
  "https://skill-nest-plum.vercel.app"
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

// =========================================
// ✅ FILE UPLOAD SETUP (Writable on Render via /tmp)
// =========================================
const isRender = !!process.env.RENDER;
const uploadDir = isRender ? '/tmp/skillnest-uploads' : './uploads';

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] }
});

// =========================================
// ✅ SAFETY NET + HELPER
// =========================================
const safeSendPush = (userId, title, body) => {
  if (typeof sendPush === 'function') return sendPush(userId, title, body);
  return Promise.resolve();
};

const safeSendEmail = (to, subject, text) => {
  if (typeof sendEmail === 'function') return sendEmail(to, subject, text);
  return Promise.resolve();
};

async function createNotification(recipientId, title, message, type, emailAddress = null) {
    try {
        await db.collection('notifications').add({
            recipientId, title, message, type, read: false, createdAt: FieldValue.serverTimestamp()
        });
        await safeSendPush(recipientId, title, message);
        if (emailAddress) await safeSendEmail(emailAddress, title, message);
    } catch (error) { console.error("Notif error:", error); }
}

// =========================================
// ✅ ROUTES
// =========================================
const needsRoutes = require('./routes/needs');
const settingsRoutes = require('./routes/settings');

app.use('/api/needs', needsRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/', (req, res) => res.send('SkillNest API is running!'));

// File Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.status(200).json({ url: fileUrl });
});

// ✅ NEW: Advanced Notification Endpoint (Email + Push + In-app)
app.post('/api/notify', async (req, res) => {
  const { recipientId, title, message, type, email } = req.body;
  try {
    // 1. In-app notification
    await db.collection('notifications').add({
      recipientId, title, message, type, read: false, createdAt: FieldValue.serverTimestamp()
    });

    // 2. Push notification (if user has FCM token)
    await safeSendPush(recipientId, title, message);

    // 3. Email notification (if email provided)
    if (email) await safeSendEmail(email, title, message);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Notification endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================
// ✅ SOCKET.IO (With Clock Tolerance)
// =========================================
io.use(async (socket, next) => {
  try { 
    const token = socket.handshake.auth.token; 
    socket.user = await auth.verifyIdToken(token); 
    next(); 
  } catch (err) { 
    // Retry with tolerance if clock is off
    try {
      const token = socket.handshake.auth.token;
      socket.user = await auth.verifyIdToken(token, false);
      next();
    } catch (retryError) {
      next(new Error('Authentication error'));
    }
  }
});

io.on('connection', (socket) => {
  socket.on('join_chat', (chatId) => socket.join(chatId));
  socket.on('typing', (chatId) => socket.to(chatId).emit('typing'));
  socket.on('stop_typing', (chatId) => socket.to(chatId).emit('stop_typing'));

  socket.on('mark_messages_read', async (chatId) => {
    try {
      const chatDoc = await db.collection('chats').doc(chatId).get();
      if (chatDoc.exists) {
        const otherUser = chatDoc.data().participants.find(p => p !== socket.user.uid);
        if (otherUser) io.to(chatId).emit('message_read', { readerId: socket.user.uid });
      }
    } catch (error) { console.error("Mark read error:", error); }
  });

  socket.on('send_message', async (data) => {
    const { chatId, message } = data;

    try {
      const settingsDoc = await db.collection('settings').doc('platform').get();
      if (settingsDoc.exists && settingsDoc.data().allowChats === false) {
        socket.emit('chats_disabled', { message: 'Chatting is currently disabled by the admin.' });
        return;
      }
    } catch (e) { console.error("Error checking chat settings:", e); }

    try {
      const messageRef = await db.collection('chats').doc(chatId).collection('messages').add({
        ...message, 
        sender: socket.user.uid, 
        read: false, 
        createdAt: FieldValue.serverTimestamp()
      });

      await db.collection('chats').doc(chatId).update({
        lastMessage: message.text || 'File sent', 
        updatedAt: FieldValue.serverTimestamp()
      });

      io.to(chatId).emit('receive_message', { id: messageRef.id, ...message, sender: socket.user.uid, read: false });

      const chatDoc = await db.collection('chats').doc(chatId).get();
      if (chatDoc.exists) {
        const recipientId = chatDoc.data().participants.find(p => p !== socket.user.uid);
        if (recipientId) {
          let senderName = "Someone";
          const senderDoc = await db.collection('users').doc(socket.user.uid).get();
          if (senderDoc.exists) senderName = senderDoc.data().name || 'User';
          
          await createNotification(recipientId, 'New Message 💬', `You have a new message from ${senderName}`, 'message');
          
          const recipientDoc = await db.collection('users').doc(recipientId).get();
          if (recipientDoc.exists && recipientDoc.data().email) {
            await safeSendEmail(recipientDoc.data().email, 'New Message 💬', `You have a new message from ${senderName} on SkillNest.`);
          }
        }
      }
    } catch (error) { console.error('Socket error:', error); }
  });

  socket.on('disconnect', () => console.log('User disconnected'));
});

// =========================================
// ✅ APP START
// =========================================
(async () => {
    try {
        const usersSnapshot = await db.collection('users').get();
        usersSnapshot.forEach(async (doc) => {
            await createNotification(doc.id, 'App Update 🚀', 'SkillNest is now fully upgraded with real-time chat, notifications, and more!', 'update');
        });
    } catch (e) { console.error("Update notification failed", e); }
})();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));