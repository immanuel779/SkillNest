import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import AppLayout from "../components/AppLayout";
// ✅ FIX: Added FaCommentDots to the import!
import { FaSearch, FaEye, FaTrash, FaBan, FaStopCircle, FaCheckCircle, FaUndo, FaUserSlash, FaUserCheck, FaTimes, FaCommentDots } from "react-icons/fa";

const AdminChats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const [chatsSnapshot, usersSnapshot] = await Promise.all([
          getDocs(collection(db, "chats")),
          getDocs(collection(db, "users"))
        ]);

        const usersMap = {};
        usersSnapshot.docs.forEach(userDoc => {
          const data = userDoc.data();
          usersMap[userDoc.id] = data;
          if (data.email) usersMap[data.email] = data;
        });

        const chatList = await Promise.all(chatsSnapshot.docs.map(async (d) => {
          const data = d.data();
          const names = [];
          for (const uid of data.participants) {
            const userData = usersMap[uid] || usersMap[uid] || null;
            if (userData) {
              names.push({ 
                uid, 
                name: userData.name || "User", 
                email: userData.email || "",
                avatarUrl: userData.avatarUrl || "",
                blocked: userData.blocked || false 
              });
            } else {
              names.push({ uid, name: "User", blocked: false });
            }
          }
          return { id: d.id, ...data, participantsInfo: names };
        }));

        chatList.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        setChats(chatList);
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  const filteredChats = chats.filter(chat =>
    chat.participantsInfo.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (chat.lastMessage || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewMessages = async (chatId) => {
    setSelectedChat(chatId);
    try {
      const msgSnapshot = await getDocs(collection(db, "chats", chatId, "messages"));
      setMessages(msgSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const deleteConversation = async (chatId) => {
    if (!confirm("Delete this entire conversation? This cannot be undone!")) return;
    try {
      await deleteDoc(doc(db, "chats", chatId));
      setChats(chats.filter(c => c.id !== chatId));
      setMessage("✅ Conversation deleted!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error deleting conversation."); }
  };

  const suspendConversation = async (chatId) => {
    try {
      await updateDoc(doc(db, "chats", chatId), { chatStatus: "suspended" });
      setChats(chats.map(c => c.id === chatId ? { ...c, chatStatus: "suspended" } : c));
      setMessage("🚫 Conversation suspended!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error suspending conversation."); }
  };

  const banConversation = async (chat) => {
    if (!confirm("Ban this conversation? Both participants will be blocked!")) return;
    try {
      await updateDoc(doc(db, "chats", chat.id), { chatStatus: "banned" });
      await Promise.all(chat.participantsInfo.map(p => updateDoc(doc(db, "users", p.uid), { blocked: true })));
      setChats(chats.map(c => c.id === chat.id ? { ...c, chatStatus: "banned" } : c));
      setMessage("🔨 Conversation banned!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error banning conversation."); }
  };

  const reactivateConversation = async (chat) => {
    try {
      await updateDoc(doc(db, "chats", chat.id), { chatStatus: "active" });
      await Promise.all(chat.participantsInfo.map(p => updateDoc(doc(db, "users", p.uid), { blocked: false })));
      setChats(chats.map(c => c.id === chat.id ? { ...c, chatStatus: "active" } : c));
      setMessage("✅ Conversation reactivated!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error reactivating conversation."); }
  };

  const deleteMessage = async (chatId, msgId) => {
    if (!confirm("Delete this message permanently?")) return;
    try {
      await deleteDoc(doc(db, "chats", chatId, "messages", msgId));
      setMessages(messages.filter(m => m.id !== msgId));
      setMessage("✅ Message deleted!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { alert("Error deleting message."); }
  };

  const toggleBlockUser = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const newBlocked = !userDoc.data().blocked;
        await updateDoc(doc(db, "users", uid), { blocked: newBlocked });
        setMessage(newBlocked ? "🔒 User blocked!" : "🔓 User unblocked!");
        setTimeout(() => setMessage(null), 3000);
        window.location.reload();
      }
    } catch (err) { alert("Error blocking user."); }
  };

  if (loading) return <div className="admin-loader"><div className="loader-spinner"></div><p>Loading Chats...</p></div>;

  return (
    <AppLayout>
      <div className="admin-header">
        <h1>Chat Monitoring</h1>
        <span className="admin-badge">💬 Total: {chats.length}</span>
      </div>

      {message && <div className="success-alert">{message}</div>}

      <div className="search-wrapper">
        <span className="search-icon"><FaSearch /></span>
        <input className="input-field" placeholder="Search chats by name, email, or message..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>
            <FaTimes />
          </button>
        )}
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr><th>Participants</th><th>Last Message</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredChats.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: "center", padding: "20px", opacity: 0.7 }}>No chats found.</td></tr>
            ) : (
              filteredChats.map(chat => (
                <tr key={chat.id}>
                  <td data-label="Participants">
                    {chat.participantsInfo.map(p => (
                      <div key={p.uid} className="participant-row">
                        <div className="participant-info">
                          <strong>{p.name}</strong>
                          {p.blocked ? <span className="blocked-indicator">🔒 Blocked</span> : null}
                        </div>
                        <button className="btn-sm" onClick={() => toggleBlockUser(p.uid)}>
                          {p.blocked ? <FaUserCheck /> : <FaUserSlash />}
                        </button>
                      </div>
                    ))}
                  </td>
                  <td data-label="Last Message">{chat.lastMessage || "No messages yet"}</td>
                  <td data-label="Status"><span className={`status-badge ${chat.chatStatus === "banned" ? "closed" : chat.chatStatus === "suspended" ? "pending" : "approved"}`}>{chat.chatStatus || "active"}</span></td>
                  <td data-label="Actions">
                    <div className="chat-action-buttons">
                      <button className="btn-sm" onClick={() => viewMessages(chat.id)}><FaEye /> View</button>
                      {chat.chatStatus === "active" || !chat.chatStatus ? (
                        <>
                          <button className="btn-sm" onClick={() => suspendConversation(chat.id)}><FaStopCircle /> Suspend</button>
                          <button className="btn-danger" onClick={() => banConversation(chat)}><FaBan /> Ban</button>
                        </>
                      ) : (
                        <button className="btn-sm" onClick={() => reactivateConversation(chat)}><FaUndo /> Reactivate</button>
                      )}
                      <button className="btn-danger" onClick={() => deleteConversation(chat.id)}><FaTrash /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedChat && (
        <div className="modal-overlay" onClick={() => setSelectedChat(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaCommentDots /> Messages</h3>
              <button className="btn-sm" onClick={() => setSelectedChat(null)}>Close</button>
            </div>
            <div className="chat-messages-admin">
              {messages.length === 0 && <p style={{ textAlign: "center", opacity: 0.7 }}>No messages in this chat.</p>}
              {messages.map((msg) => (
                <div key={msg.id} className={`admin-message ${msg.sender === "admin" ? "admin" : "user"}`}>
                  <p>{msg.text}</p>
                  <span>{msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleString() : ""}</span>
                  <button className="btn-danger" onClick={() => deleteMessage(selectedChat, msg.id)}><FaTrash /> Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminChats;