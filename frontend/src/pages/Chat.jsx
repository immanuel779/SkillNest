import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import { useSettings } from "../context/SettingsContext";

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings(); 

  // Crash proof settings check (defaults to true if settings haven't loaded)
  const canChat = settings?.platform?.allowChats ?? true;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const currentUser = auth.currentUser;

  // Connect Socket & Load Messages (FIXED stale closure bug)
  useEffect(() => {
    let newSocket;
    let unsub;

    const connectSocket = async () => {
      try {
        const token = await currentUser.getIdToken();
        newSocket = io("http://localhost:5000", { auth: { token } });
        setSocket(newSocket);

        newSocket.on("connect", () => newSocket.emit("join_chat", chatId));
        newSocket.on("typing", () => setIsTyping(true));
        newSocket.on("stop_typing", () => setIsTyping(false));
        newSocket.on("receive_message", (msg) => setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
        newSocket.on("message_read", () => setMessages(prev => prev.map(m => m.sender === currentUser.uid ? { ...m, read: true } : m)));
      } catch (e) { console.error(e); }
    };

    connectSocket();

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    unsub = onSnapshot(q, async (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs); 
      setLoading(false);
    });

    return () => { 
      if (unsub) unsub(); 
      if (newSocket) newSocket.disconnect(); 
    };
  }, [chatId]);

  const sendMessage = async (msgObj) => {
    if (isSending) return;
    if (!canChat) { alert("Chatting is disabled by admin."); return; }
    
    setIsSending(true);
    try {
      if (socket && socket.connected) socket.emit("send_message", { chatId, message: msgObj });
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage({ type: 'text', text: text.trim() });
    setText("");
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // File Upload (PDF / Image)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = await currentUser.getIdToken();

      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      const fileUrl = data.url;
      const isImage = file.type.startsWith("image/");
      const fileType = isImage ? "image" : "pdf";
      await sendMessage({ type: fileType, text: file.name, fileUrl: fileUrl });
    } catch (error) {
      alert("Upload failed");
    } finally {
      setFileUploading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h3>Chat Room</h3>
      </div>

      <div className="chat-messages">
        {loading && <p style={{ textAlign: 'center', opacity: 0.7 }}>Loading messages...</p>}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble ${msg.sender === currentUser?.uid ? 'mine' : 'theirs'}`}>
            {msg.type === 'image' && (
              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                <img src={msg.fileUrl} alt="Shared file" className="chat-image" />
              </a>
            )}
            {msg.type === 'pdf' && (
              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="file-attachment">
                <span className="file-icon">📄</span>
                <div><span className="download-text">View PDF</span></div>
              </a>
            )}
            {!msg.type || msg.type === 'text' ? <p>{msg.text}</p> : null}

            <div className="message-footer">
              <span className="message-time">
                {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString() : 'Just now'}
              </span>
              {msg.sender === currentUser?.uid && (
                <span className="message-ticks">
                  {msg.read ? <span className="double-tick">✔✔</span> : <span className="single-tick">✔</span>}
                </span>
              )}
            </div>
          </div>
        ))}

        {isTyping && <div className="typing-indicator"><span></span><span></span><span></span></div>}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-container" onSubmit={handleSend}>
        <input 
          type="text" 
          className="chat-input" 
          placeholder={fileUploading ? "Uploading..." : "Type a message..."} 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
        />
        <button type="button" className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
        <label className="file-upload-btn">
          {fileUploading ? '⏳' : '📎'}
          <input type="file" style={{ display: "none" }} onChange={handleFileUpload} disabled={fileUploading} />
        </label>
        <button type="submit" className="send-btn" disabled={isSending || fileUploading}>➤</button>
      </form>

      {showEmojiPicker && (
        <div className="emoji-picker-container">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default Chat;