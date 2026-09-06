const { sendEmail, sendPush, sendNotification } = require('./utils/email'); // Make sure this file exists!
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
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);
const adminApp = initializeApp({ credential: cert(serviceAccount) });

// Modular SDK instances
const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

const app = express();
app.use(cors());
app.use(express.json());

// =========================================
// FILE UPLOAD SETUP (Supports Images & PDFs)
// =========================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

// =========================================
// SAFETY NET: Ensure functions exist to prevent crashes
// =========================================
const safeSendPush = (userId, title, body) => {
  if (typeof sendPush === 'function') return sendPush(userId, title, body);
  return Promise.resolve();
};

const safeSendEmail = (to, subject, text) => {
  if (typeof sendEmail === 'function') return sendEmail(to, subject, text);
  return Promise.resolve();
};

// =========================================
// HELPER FUNCTION: Notification + Push + Email
// =========================================
async function createNotification(recipientId, title, message, type, emailAddress = null) {
    try {
        await db.collection('notifications').add({
            recipientId, title, message, type, read: false, createdAt: FieldValue.serverTimestamp()
        });
        await safeSendPush(recipientId, title, message); 
        
        // If email address is provided, send email too
        if (emailAddress) {
            await safeSendEmail(emailAddress, title, message);
        }
    } catch (error) { console.error("Notif error:", error); }
}

// =========================================
// ROUTES
// =========================================
const needsRoutes = require('./routes/needs');
const settingsRoutes = require('./routes/settings');

app.use('/api/needs', needsRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/', (req, res) => res.send('SkillNest API is running!'));

// File Upload Endpoint (Works for Images & PDFs)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.status(200).json({ url: fileUrl });
});

// =========================================
// SOCKET.IO CONNECTION (Real-time Chat)
// =========================================
io.use(async (socket, next) => {
  try { 
    const token = socket.handshake.auth.token; 
    socket.user = await auth.verifyIdToken(token); 
    next(); 
  } catch (err) { 
    next(new Error('Authentication error')); 
  }
});

io.on('connection', (socket) => {
  socket.on('join_chat', (chatId) => socket.join(chatId));
  socket.on('typing', (chatId) => socket.to(chatId).emit('typing'));
  socket.on('stop_typing', (chatId) => socket.to(chatId).emit('stop_typing'));

  // Mark messages as READ (WhatsApp style)
  socket.on('mark_messages_read', async (chatId) => {
    try {
      const chatDoc = await db.collection('chats').doc(chatId).get();
      if (chatDoc.exists) {
        const otherUser = chatDoc.data().participants.find(p => p !== socket.user.uid);
        if (otherUser) io.to(chatId).emit('message_read', { readerId: socket.user.uid });
      }
    } catch (error) { console.error("Mark read error:", error); }
  });

  // Send message (Save to Firestore + Broadcast + Notify)
  socket.on('send_message', async (data) => {
    const { chatId, message } = data;

    // 🔒 BACKEND ENFORCEMENT: Block chats if admin disabled it
    try {
      const settingsDoc = await db.collection('settings').doc('platform').get();
      if (settingsDoc.exists && settingsDoc.data().allowChats === false) {
        socket.emit('chats_disabled', { message: 'Chatting is currently disabled by the admin.' });
        return;
      }
    } catch (e) {
      console.error("Error checking chat settings:", e);
    }

    try {
      // Save full message object (text, type, fileUrl, etc.)
      const messageRef = await db.collection('chats').doc(chatId).collection('messages').add({
        ...message, 
        sender: socket.user.uid, 
        read: false, 
        createdAt: FieldValue.serverTimestamp()
      });

      // Update chat's last message
      await db.collection('chats').doc(chatId).update({
        lastMessage: message.text || 'File sent', 
        updatedAt: FieldValue.serverTimestamp()
      });

      // Broadcast to everyone in the room
      io.to(chatId).emit('receive_message', { id: messageRef.id, ...message, sender: socket.user.uid, read: false });

      // Notify the other participant (with their real name)
      const chatDoc = await db.collection('chats').doc(chatId).get();
      if (chatDoc.exists) {
        const recipientId = chatDoc.data().participants.find(p => p !== socket.user.uid);
        if (recipientId) {
          let senderName = "Someone";
          const senderDoc = await db.collection('users').doc(socket.user.uid).get();
          if (senderDoc.exists) senderName = senderDoc.data().name || 'User';
          
          // Create notification (In-app + Push)
          await createNotification(recipientId, 'New Message 💬', `You have a new message from ${senderName}`, 'message');
          
          // Also send email if recipient has one
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
// APP START (Send Update Notification to all users)
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