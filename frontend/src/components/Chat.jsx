import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import '../styles/Chat.css';

const formatDateLabel = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
};

const Chat = ({ socket: propSocket, onMessagesRead }) => {
  const [currentUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const token = localStorage.getItem('token');

  const [socket, setSocket] = useState(propSocket || null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoleTab, setActiveRoleTab] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const fileInputRef = useRef(null);
  const messageEndRef = useRef(null);

  // Toast signalling helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Initialize Socket.io connection (use propSocket if provided, otherwise fallback to local connection)
  useEffect(() => {
    if (propSocket) {
      setSocket(propSocket);
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    const userId = currentUser.id || currentUser._id;
    if (userId) {
      newSocket.emit('join', userId);
    }

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser, propSocket]);

  // Listen for real-time messages and read events
  useEffect(() => {
    if (!socket) return;

    const currentUserId = currentUser.id || currentUser._id;

    const handleReceiveMessage = (msg) => {
      // Add message if it belongs to the current open conversation
      if (
        (msg.senderId === currentUserId && msg.receiverId === selectedUser?._id) ||
        (msg.senderId === selectedUser?._id && msg.receiverId === currentUserId)
      ) {
        setMessages((prev) => [...prev, msg]);
        if (msg.senderId !== currentUserId) {
          showToast(`New message from ${selectedUser?.name || 'User'}`, 'info');
          // Automatically mark it read on the backend
          fetch(`${import.meta.env.VITE_API_URL}/api/chat/read/${msg.senderId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(() => {
              if (onMessagesRead) onMessagesRead();
            })
            .catch(err => console.error('Error auto-marking read:', err));
        }
      } else {
        // Message from someone else in the directory
        const senderId = msg.senderId;
        if (senderId !== currentUserId) {
          setUnreadCounts(prev => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1
          }));
          const sender = users.find((u) => u._id === senderId);
          showToast(`New message from ${sender?.name || 'Someone'}!`, 'info');
        }
      }
    };

    const handleMessagesRead = ({ readerId }) => {
      // If the selected user read our messages, mark them as read locally
      if (selectedUser && readerId === selectedUser._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId === currentUserId ? { ...msg, read: true } : msg
          )
        );
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messagesRead', handleMessagesRead);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [socket, selectedUser, currentUser, users, token, onMessagesRead]);

  // Fetch chat-eligible users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          setUsers(result.data);
          // Initialize unread counts map
          const counts = {};
          result.data.forEach((u) => {
            counts[u._id] = u.unreadCount || 0;
          });
          setUnreadCounts(counts);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, [token]);

  // Handle choosing a user to chat with
  const handleSelectUser = async (u) => {
    setSelectedUser(u);
    setMobileShowChat(true);

    // Clear unread count locally
    setUnreadCounts(prev => ({
      ...prev,
      [u._id]: 0
    }));

    // Post to mark as read on DB
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/chat/read/${u._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onMessagesRead) onMessagesRead();
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Fetch message history when selectedUser changes
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/messages/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          setMessages(result.data);
        }
      } catch (err) {
        console.error('Error fetching message history:', err);
      }
    };
    fetchMessages();
  }, [selectedUser, token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !selectedUser) return;

    const currentUserId = currentUser.id || currentUser._id;

    const messageData = {
      senderId: currentUserId,
      receiverId: selectedUser._id,
      text: inputText,
      fileUrl: null,
      fileName: null
    };

    socket.emit('sendMessage', messageData);
    setInputText('');
    showToast('Message sent!', 'success');
  };

  // Upload file via Multer
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUser || !socket) return;

    const currentUserId = currentUser.id || currentUser._id;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        // Send file as message
        const messageData = {
          senderId: currentUserId,
          receiverId: selectedUser._id,
          text: `Sent an attachment: ${result.data.fileName}`,
          fileUrl: result.data.fileUrl,
          fileName: result.data.fileName
        };
        socket.emit('sendMessage', messageData);
        showToast('Attachment uploaded and sent!', 'success');
      } else {
        alert(result.message || 'File upload failed');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Error uploading file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filters users list based on role tabs & query
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = activeRoleTab === 'all' || u.role === activeRoleTab;
    return matchesSearch && matchesRole;
  });

  const getProfileUrl = (relativeUrl) => {
    if (!relativeUrl) return 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    return `${import.meta.env.VITE_API_URL}${relativeUrl}`;
  };

  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    return extensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  return (
    <div className={`chat-container-card card-shadow ${mobileShowChat ? 'mobile-show-window' : 'mobile-show-sidebar'}`}>
      {/* Sidebar: User List */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Chat Directory</h3>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chat-search-input"
          />
          <div className="chat-role-tabs">
            {['all', 'admin', 'teacher', 'student'].map((role) => (
              <button
                key={role}
                className={`chat-role-tab-btn ${activeRoleTab === role ? 'active' : ''}`}
                onClick={() => setActiveRoleTab(role)}
              >
                {role.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="chat-users-list">
          {filteredUsers.map((u) => (
            <div
              key={u._id}
              className={`chat-user-item ${selectedUser?._id === u._id ? 'selected' : ''}`}
              onClick={() => handleSelectUser(u)}
            >
              <img src={getProfileUrl(u.profilePicture)} alt={u.name} className="chat-user-avatar" />
              <div className="chat-user-info">
                <div className="chat-user-name-row">
                  <span className="chat-user-name">{u.name}</span>
                  {unreadCounts[u._id] > 0 && (
                    <span className="chat-unread-badge">{unreadCounts[u._id]}</span>
                  )}
                </div>
                <span className={`chat-user-role-badge role-${u.role}`}>{u.role}</span>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="chat-no-users">No users found.</div>
          )}
        </div>
      </div>

      {/* Main Conversation Window */}
      <div className="chat-window">
        {selectedUser ? (
          <>
            {/* Conversation Header */}
            <div className="chat-window-header">
              <button 
                type="button" 
                className="chat-mobile-back-btn" 
                onClick={() => setMobileShowChat(false)}
                aria-label="Back to chat directory"
              >
                ← Back
              </button>
              <img
                src={getProfileUrl(selectedUser.profilePicture)}
                alt={selectedUser.name}
                className="chat-header-avatar"
              />
              <div>
                <h4>{selectedUser.name}</h4>
                <span className={`chat-user-role-badge role-${selectedUser.role}`}>{selectedUser.role}</span>
              </div>
            </div>

            {/* Message History */}
            <div className="chat-messages-container">
              {messages.map((msg, idx) => {
                const currentUserId = currentUser.id || currentUser._id;
                const isSentByMe = msg.senderId === currentUserId;
                
                // Group by date logic
                const messageDate = new Date(msg.createdAt).toDateString();
                const prevMessageDate = idx > 0 ? new Date(messages[idx - 1].createdAt).toDateString() : null;
                const showDateDivider = messageDate !== prevMessageDate;

                return (
                  <div key={msg._id || idx} style={{ width: '100%' }}>
                    {showDateDivider && (
                      <div className="chat-date-divider">
                        <div className="chat-date-divider-line"></div>
                        <span className="chat-date-divider-text">{formatDateLabel(msg.createdAt)}</span>
                        <div className="chat-date-divider-line"></div>
                      </div>
                    )}
                    <div className={`chat-message-bubble-wrapper ${isSentByMe ? 'sent' : 'received'}`}>
                      <div className="chat-message-bubble">
                        {msg.text && <p className="chat-msg-text">{msg.text}</p>}
                        {msg.fileUrl && (
                          <div className="chat-msg-attachment">
                            {isImageFile(msg.fileName) ? (
                              <a href={`${import.meta.env.VITE_API_URL}${msg.fileUrl}`} target="_blank" rel="noreferrer">
                                <img
                                  src={`${import.meta.env.VITE_API_URL}${msg.fileUrl}`}
                                  alt="Attachment"
                                  className="chat-attachment-image-preview"
                                />
                              </a>
                            ) : (
                              <a
                                href={`${import.meta.env.VITE_API_URL}${msg.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="chat-file-link"
                              >
                                📎 {msg.fileName || 'Download File'}
                              </a>
                            )}
                          </div>
                        )}
                        <div className="chat-msg-meta">
                          <span className="chat-msg-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isSentByMe && (
                            <span className={`chat-msg-status-tick ${msg.read ? 'read' : 'unread'}`} title={msg.read ? 'Read' : 'Sent'}>
                              <svg className="tick-svg" viewBox="0 0 16 15" width="16" height="15">
                                <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033L5.138 6.965a.365.365 0 0 0-.507-.012l-.462.406a.364.364 0 0 0-.012.514l3.416 3.416a.7.7 0 0 0 .99 0l6.505-7.462a.366.366 0 0 0-.056-.51zm-4.218 0l-.478-.372a.365.365 0 0 0-.51.063L4.448 9.879a.32.32 0 0 1-.484.033L2.73 8.682l-.462.406a.364.364 0 0 0-.012.514l2.122 2.122a.7.7 0 0 0 .99 0l5.474-6.897a.366.366 0 0 0-.05-.51z"/>
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messageEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="chat-input-bar">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button
                type="button"
                className="chat-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Attach a file"
              >
                {uploading ? (
                  <span className="chat-upload-spinner">...</span>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 0 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                )}
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message here..."
                className="chat-message-input-box"
              />
              <button type="submit" className="chat-send-btn" disabled={!inputText.trim()} title="Send message">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="chat-no-conversation">
            <div className="chat-placeholder-card">
              {currentUser.profilePicture ? (
                <img
                  src={getProfileUrl(currentUser.profilePicture)}
                  alt={currentUser.name}
                  className="chat-placeholder-avatar"
                />
              ) : (
                <div className="chat-placeholder-icon-wrap">💬</div>
              )}
              <span className="chat-placeholder-welcome">Welcome to Campus Connect</span>
              <h3>Hello, {currentUser.name || 'User'}!</h3>
              <p>Select a student, teacher, or admin from the directory sidebar to start a real-time secure conversation.</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Notifications System (Signalling) */}
      <div className="chat-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`chat-toast ${t.type}`}>
            <span className="toast-icon">{t.type === 'success' ? '✔' : '✉'}</span>
            <span className="toast-msg">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Chat;
