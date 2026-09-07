import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { FaArrowLeft, FaSearch, FaUserCircle } from "react-icons/fa";
import AppLayout from "../components/AppLayout";

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const timeAgo = (timestamp) => {
    if (!timestamp) return "";
    const seconds = Math.floor((Date.now() - timestamp.seconds * 1000) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      try {
        // 1. Fetch ALL chats
        const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
        const snapshot = await getDocs(q);
        const chatList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // 2. Fetch ALL users and build a map for UID + Email
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersMap = {};
        usersSnapshot.docs.forEach(userDoc => {
          const data = userDoc.data();
          usersMap[userDoc.id] = data; // Map by UID
          if (data.email) usersMap[data.email] = data; // Map by Email
        });

        // 3. Map chat participants to actual names
        const chatListWithNames = await Promise.all(
          chatList.map(async (chat) => {
            // Try to find the other user by UID or Email in the map
            const otherUserId = chat.participants.find((id) => id !== user.uid);
            const otherUserData = usersMap[otherUserId] || usersMap[otherUserId] || null;
            
            const otherUserName = otherUserData?.name || otherUserData?.organizationName || "User";
            const otherUserAvatar = otherUserData?.avatarUrl || "";
            const otherUserOrg = otherUserData?.organizationName || "";

            return { 
              ...chat, 
              otherUserName,
              otherUserAvatar,
              otherUserOrg
            };
          })
        );

        chatListWithNames.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        setChats(chatListWithNames);
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [user]);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === "") {
      setSearchResults([]);
      setNoResults(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    setNoResults(false);

    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const filteredUsers = allUsers.filter(u => 
        (u.name || "").toLowerCase().includes(value.toLowerCase()) ||
        (u.organizationName || "").toLowerCase().includes(value.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(value.toLowerCase())
      );

      const filteredWithoutSelf = filteredUsers.filter(u => u.id !== user.uid && u.email !== user.email);
      filteredWithoutSelf.sort((a, b) => (a.name || "z").localeCompare(b.name || "z"));

      setSearchResults(filteredWithoutSelf);
      setNoResults(filteredWithoutSelf.length === 0);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const startNewChat = async (userId) => {
    try {
      const chatsSnapshot = await getDocs(collection(db, "chats"));
      let existingChat = null;
      chatsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.participants.includes(user.uid) && data.participants.includes(userId)) existingChat = doc;
      });

      let chatId;
      if (existingChat) {
        chatId = existingChat.id;
      } else {
        const chatRef = await addDoc(collection(db, "chats"), {
          participants: [user.uid, userId],
          lastMessage: "",
          updatedAt: serverTimestamp()
        });
        chatId = chatRef.id;
      }

      navigate(`/chat/${chatId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  if (loading) return <div className="dashboard-loader"><div className="loader-spinner"></div><p>Loading Chats...</p></div>;

  return (
    <AppLayout>
      <div className="browse-container">
        <div className="browse-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}><FaArrowLeft /> Back</button>
          <h1>Messages</h1>
          <Link to="/browse" className="btn btn-primary">➕ Start New Chat</Link>
        </div>

        <div className="search-wrapper">
          <span className="search-icon"><FaSearch /></span>
          <input className="input-field" placeholder="Search by name, organization, or email..." value={searchTerm} onChange={handleSearch} />
        </div>

        {!searchTerm && chats.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>No Chats Yet</h3>
            <p style={{ opacity: 0.8, marginBottom: '20px' }}>Find an opportunity and click "Apply & Chat" to start talking to the employer!</p>
            <Link to="/browse" className="btn btn-primary">🔍 Browse Opportunities</Link>
          </div>
        )}

        {!searchTerm && chats.length > 0 && (
          <div className="chat-list">
            {chats.map((chat) => (
              <Link key={chat.id} to={`/chat/${chat.id}`} className="chat-list-item">
                <div className="chat-avatar">
                  {chat.otherUserAvatar ? <img src={chat.otherUserAvatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <FaUserCircle />}
                </div>
                <div className="chat-info">
                  <h4>{chat.otherUserName} {chat.otherUserOrg ? <span style={{ color: '#ff8c00', fontSize: '0.8rem' }}>({chat.otherUserOrg})</span> : null}</h4>
                  <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>{chat.lastMessage ? chat.lastMessage : "Start the conversation..."}</p>
                  <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{timeAgo(chat.updatedAt)}</span>
                </div>
                <span className="chat-arrow">➜</span>
              </Link>
            ))}
          </div>
        )}

        {searchTerm && searchResults.length > 0 && (
          <div className="chat-list">
            <h3 className="section-title">Search Results</h3>
            {searchResults.map(user => (
              <div key={user.id} className="chat-list-item" onClick={() => startNewChat(user.id)} style={{ cursor: 'pointer' }}>
                <div className="chat-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <FaUserCircle />}</div>
                <div className="chat-info">
                  <h4>{user.name || "User"}</h4>
                  <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>{user.organizationName || user.email || user.role}</p>
                </div>
                <span className="chat-arrow">💬 Start Chat</span>
              </div>
            ))}
          </div>
        )}

        {searchTerm && noResults && <div className="empty-state"><div className="empty-icon">🔍</div><h3>User Not Found</h3></div>}
      </div>
    </AppLayout>
  );
};

export default Messages;