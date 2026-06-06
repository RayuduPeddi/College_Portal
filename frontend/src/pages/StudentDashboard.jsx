import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Chat from '../components/Chat';
import AIAssistant from '../components/AIAssistant';
import { io } from 'socket.io-client';
import { DashboardIcon, AttendanceIcon, MarksIcon, NoticesIcon, ComplaintsIcon, MaterialsIcon, ChatIcon, AIIcon } from '../components/Icons';
import '../styles/StudentDashboard.css';

// Student Dashboard Component
const StudentDashboard = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [activeTab, setActiveTab] = useState(tab || 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab('dashboard');
    }
  }, [tab]);

  const navigateToTab = (tabId) => {
    if (tabId === 'dashboard') {
      navigate('/student-dashboard');
    } else {
      navigate(`/student-dashboard/${tabId}`);
    }
  };

  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [unseenNotices, setUnseenNotices] = useState(0);
  const [unseenMaterials, setUnseenMaterials] = useState(0);
  const [unseenComplaints, setUnseenComplaints] = useState(0);

  const [profile, setProfile] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [notices, setNotices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [newComplaint, setNewComplaint] = useState({ subject: '', description: '' });
  const [materials, setMaterials] = useState([]);
  
  // Search and accordion states
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState({});

  const toggleSubject = (subject) => {
    setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }));
  };

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleScroll = (e) => {
    if (e.target.scrollTop > 300) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    const container = document.querySelector('.dashboard-content');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return '📁';
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return '📝';
    if (['ppt', 'pptx'].includes(ext)) return '📊';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📈';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return '🖼️';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '📦';
    return '📁';
  };

  // Sidebar Menu Configuration
  const menuItems = [
    { id: 'dashboard', label: 'My Dashboard', icon: <DashboardIcon size={20} color="currentColor" /> },
    { id: 'attendance', label: 'Attendance Records', icon: <AttendanceIcon size={20} color="currentColor" /> },
    { id: 'marks', label: 'My Marks', icon: <MarksIcon size={20} color="currentColor" /> },
    { id: 'notices', label: 'Notices', icon: <NoticesIcon size={20} color="currentColor" />, badge: unseenNotices },
    { id: 'complaints', label: 'My Complaints', icon: <ComplaintsIcon size={20} color="currentColor" />, badge: unseenComplaints },
    { id: 'materials', label: 'Study Materials', icon: <MaterialsIcon size={20} color="currentColor" />, badge: unseenMaterials },
    { id: 'chat', label: 'Live Chat', icon: <ChatIcon size={20} color="currentColor" />, badge: unreadCount },
    { id: 'ai-assistant', label: 'AI Assistant', icon: <AIIcon size={20} color="currentColor" /> }
  ];

  // Fetch total unread count from backend
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setUnreadCount(result.data.count);
      }
    } catch (err) {
      console.error('Error fetching total unread count:', err);
    }
  };

  // Connect socket at Dashboard level for real-time sidebar count updates
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!token || !userId) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl);
    setSocket(newSocket);
    newSocket.emit('join', userId);

    newSocket.on('receiveMessage', (msg) => {
      if (msg.senderId !== userId) {
        fetchUnreadCount();
      }
    });

    newSocket.on('messagesRead', () => {
      fetchUnreadCount();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  // Sync unreadCount when activeTab changes
  useEffect(() => {
    fetchUnreadCount();
  }, [activeTab]);

  useEffect(() => {
    fetchProfile();
    fetchAttendance();
    fetchMarks();
    fetchNotices();
    fetchComplaints();
    fetchMaterials();
  }, []);



  const fetchProfile = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/student/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setProfile(result.data);
    } catch (err) { console.log(err); }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/student/attendance', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setAttendance(result.data);
    } catch (err) { console.log(err); }
  };

  const fetchMarks = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/student/marks', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setMarks(result.data);
    } catch (err) { console.log(err); }
  };

  const fetchNotices = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/student/notices', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) {
        setNotices(result.data);
        const seenCount = parseInt(localStorage.getItem('seenNoticesCount') || '0', 10);
        if (activeTab === 'notices') {
          localStorage.setItem('seenNoticesCount', result.data.length);
          setUnseenNotices(0);
        } else {
          setUnseenNotices(Math.max(0, result.data.length - seenCount));
        }
      }
    } catch (err) { console.log(err); }
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/student/complaints', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) {
        setComplaints(result.data);
        const seenCount = parseInt(localStorage.getItem('seenComplaintsCount') || '0', 10);
        if (activeTab === 'complaints') {
          localStorage.setItem('seenComplaintsCount', result.data.length);
          setUnseenComplaints(0);
        } else {
          setUnseenComplaints(Math.max(0, result.data.length - seenCount));
        }
      }
    } catch (err) { console.log(err); }
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/student/materials', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setMaterials(result.data);
        const seenCount = parseInt(localStorage.getItem('seenMaterialsCount') || '0', 10);
        if (activeTab === 'materials') {
          localStorage.setItem('seenMaterialsCount', result.data.length);
          setUnseenMaterials(0);
        } else {
          setUnseenMaterials(Math.max(0, result.data.length - seenCount));
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Clear unseen counts when visiting tab
  useEffect(() => {
    if (activeTab === 'notices') {
      localStorage.setItem('seenNoticesCount', notices.length);
      setUnseenNotices(0);
    } else if (activeTab === 'materials') {
      localStorage.setItem('seenMaterialsCount', materials.length);
      setUnseenMaterials(0);
    } else if (activeTab === 'complaints') {
      localStorage.setItem('seenComplaintsCount', complaints.length);
      setUnseenComplaints(0);
    }
  }, [activeTab, notices.length, materials.length, complaints.length]);

  const handleAddComplaint = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/student/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newComplaint)
      });
      const result = await res.json();
      if (result.success) {
        alert('Complaint raised successfully!');
        setNewComplaint({ subject: '', description: '' });
        fetchComplaints();
      } else alert(result.message);
    } catch (err) { console.log(err); }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile-picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const result = await res.json();
      if (result.success) {
        alert('Profile picture updated successfully!');
        const updatedUser = { ...user, profilePicture: result.data.user.profilePicture };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        fetchProfile();
      } else {
        alert(result.message || 'Upload failed');
      }
    } catch (err) {
      console.log(err);
      alert('Error uploading profile picture');
    }
  };

  // Calculate attendance percentage
  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0;
    const presentDays = attendance.filter(a => a.status === 'Present').length;
    return ((presentDays / attendance.length) * 100).toFixed(1);
  };

  const getProfilePictureUrl = () => {
    if (user?.profilePicture) {
      return `${import.meta.env.VITE_API_URL}${user.profilePicture}`;
    }
    return 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  };

  const filteredMaterials = materials.filter(m => 
    m.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedMaterials = filteredMaterials.reduce((acc, m) => {
    const sub = m.subject || 'General';
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push(m);
    return acc;
  }, {});

  return (
    <div className="dashboard-layout">
      <Sidebar 
        role="student" 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          navigateToTab(tab);
          setSidebarOpen(false);
        }} 
        menuItems={menuItems} 
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        unreadCount={unreadCount}
      />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      
      <div className="main-content-area">
        <Navbar 
            role="student" 
            userName={user.name} 
            userProfilePicture={user.profilePicture}
            unreadCount={unreadCount}
            unseenMaterials={unseenMaterials}
            onMenuToggle={() => {
              if (window.innerWidth <= 768) {
                setSidebarOpen(!sidebarOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            setActiveTab={navigateToTab}
          />

          <div className="dashboard-content" onScroll={handleScroll}>
            <div className="dashboard-tab-content-wrapper">

            {/* Main Dashboard & Profile View */}
            {activeTab === 'dashboard' && (
              <div>
                <h2>Welcome back, {user.name}!</h2>

                <div className="student-stats-container">
                  <div className="student-stat-card card-shadow outline-student">
                    <h3>Overall Attendance</h3>
                    <div className="stat-percentage">
                      <span>{calculateAttendancePercentage()}%</span>
                    </div>
                    <p className="stat-detail">Based on {attendance.length} total sessions</p>
                  </div>
                <div className="student-profile-card card-shadow outline-student">
                  <h3>My Profile</h3>
                  <div className="profile-pic-container">
                    <img 
                      src={getProfilePictureUrl()} 
                      alt="Profile" 
                      className="profile-avatar-large" 
                    />
                    <div className="profile-pic-upload-overlay">
                      <input 
                        type="file" 
                        id="student-pic-input" 
                        style={{ display: 'none' }} 
                        accept="image/*" 
                        onChange={handleProfilePictureUpload}
                      />
                      <label htmlFor="student-pic-input" className="profile-pic-upload-label">
                        Update Avatar
                      </label>
                    </div>
                  </div>
                  <div className="profile-details">
                    <p><strong>Name:</strong> {profile.userId?.name}</p>
                    <p><strong>Email:</strong> {profile.userId?.email}</p>
                    <p><strong>Roll No:</strong> {profile.rollNo}</p>
                    <p><strong>Department:</strong> {profile.department}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Records View */}
          {activeTab === 'attendance' && (
            <div className="tab-section">
              <h2>My Attendance Records</h2>
              <div className="table-container card-shadow outline-student">
                <table>
                  <thead><tr><th>Date</th><th>Subject</th><th>Status</th><th>Marked By</th></tr></thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a._id}>
                        <td data-label="Date">{new Date(a.date).toLocaleDateString()}</td>
                        <td data-label="Subject">{a.subject || 'General'}</td>
                        <td data-label="Status" style={{ color: a.status === 'Present' ? 'green' : 'red', fontWeight: '600' }}>{a.status}</td>
                        <td data-label="Marked By">{a.teacherId?.name}</td>
                      </tr>
                    ))}
                    {attendance.length === 0 && <tr><td colSpan="4">No attendance records found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Marks Records View */}
          {activeTab === 'marks' && (
            <div className="tab-section">
              <h2>My Academic Marks</h2>
              <div className="table-container card-shadow outline-student">
                <table>
                  <thead><tr><th>Subject</th><th>Marks Scored</th><th>Total Marks</th><th>Assigned By</th></tr></thead>
                  <tbody>
                    {marks.map(m => (
                      <tr key={m._id}>
                        <td data-label="Subject">{m.subject}</td>
                        <td data-label="Marks Scored" style={{ fontWeight: '600', color: '#4a148c' }}>{m.marks}</td>
                        <td data-label="Total Marks">{m.totalMarks}</td>
                        <td data-label="Assigned By">{m.teacherId?.name}</td>
                      </tr>
                    ))}
                    {marks.length === 0 && <tr><td colSpan="4">No marks records found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="tab-section">
              <h2>College Notices</h2>
              <div className="table-container card-shadow outline-student">
                <table>
                  <thead><tr><th>Date</th><th>Title</th><th>Content</th></tr></thead>
                  <tbody>
                    {notices.map(n => (
                      <tr key={n._id}>
                        <td data-label="Date">{new Date(n.date).toLocaleDateString()}</td>
                        <td data-label="Title" style={{ fontWeight: 'bold' }}>{n.title}</td>
                        <td data-label="Content">{n.content}</td>
                      </tr>
                    ))}
                    {notices.length === 0 && <tr><td colSpan="3">No notices available.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'complaints' && (
            <div className="tab-section">
              <h2>Raise a Complaint</h2>
              <form className="add-form card-shadow outline-student" onSubmit={handleAddComplaint}>
                <input required placeholder="Complaint Subject" value={newComplaint.subject} onChange={e => setNewComplaint({...newComplaint, subject: e.target.value})} />
                <textarea required placeholder="Complaint Description" value={newComplaint.description} onChange={e => setNewComplaint({...newComplaint, description: e.target.value})} />
                <button type="submit" className="action-btn">Submit Complaint</button>
              </form>

              <h2 style={{ marginTop: '20px' }}>My Complaints</h2>
              <div className="table-container card-shadow outline-student">
                <table>
                  <thead><tr><th>Date</th><th>Subject</th><th>Description</th><th>Status</th></tr></thead>
                  <tbody>
                    {complaints.map(c => (
                      <tr key={c._id}>
                        <td data-label="Date">{new Date(c.date).toLocaleDateString()}</td>
                        <td data-label="Subject">{c.subject}</td>
                        <td data-label="Description">{c.description}</td>
                        <td data-label="Status"><span className={`status-badge ${c.status?.toLowerCase()}`}>{c.status}</span></td>
                      </tr>
                    ))}
                    {complaints.length === 0 && <tr><td colSpan="4">No complaints raised yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="tab-section">
              <div className="section-header-compact">
                <h2>Academic Study Materials & Resources</h2>
                <p>Download lecture notes, handouts, guides, or syllabus documents uploaded by your teachers and administrators.</p>
              </div>

              <div className="subject-search-container" style={{ marginTop: '20px' }}>
                <div className="subject-search-input-wrapper">
                  <span className="subject-search-icon">🔍</span>
                  <input
                    type="text"
                    className="subject-search-input"
                    placeholder="Search by subject name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <h2 style={{ marginTop: '30px', marginBottom: '20px' }}>Available Study Resources ({materials.length})</h2>
              
              {materials.length === 0 ? (
                <div className="no-resources-state card-shadow">
                  <p>No study materials available yet for your course.</p>
                </div>
              ) : Object.keys(groupedMaterials).length === 0 ? (
                <div className="no-resources-state card-shadow">
                  <p>No study materials match the search query.</p>
                </div>
              ) : (
                <div className="subject-accordions-container">
                  {Object.keys(groupedMaterials).map((sub) => {
                    const isOpen = !!expandedSubjects[sub];
                    return (
                      <div className="subject-accordion-item" key={sub}>
                        <button 
                          className="subject-accordion-header" 
                          onClick={() => toggleSubject(sub)}
                          type="button"
                        >
                          <div className="subject-title-section">
                            <span className="subject-icon">📚</span>
                            <span className="subject-name-text">{sub}</span>
                            <span className="subject-resources-count">
                              {groupedMaterials[sub].length} {groupedMaterials[sub].length === 1 ? 'resource' : 'resources'}
                            </span>
                          </div>
                          <span className={`subject-chevron ${isOpen ? 'open' : ''}`}>▼</span>
                        </button>
                        {isOpen && (
                          <div className="subject-accordion-body">
                            <div className="resources-grid" style={{ marginTop: '20px' }}>
                              {groupedMaterials[sub].map(m => (
                                <div className="resource-card card-shadow" key={m._id}>
                                  <div className="resource-card-header">
                                    <span className="resource-subject-badge">{m.subject || 'General'}</span>
                                  </div>
                                  
                                  <div className="resource-card-body">
                                    <h3 className="resource-title" title={m.title}>{m.title}</h3>
                                    <p className="resource-desc" title={m.description}>{m.description || 'No description provided.'}</p>
                                  </div>
                                  
                                  <div className="resource-card-meta">
                                    <span className="resource-author" title={`${m.uploadedBy?.name} (${m.uploadedBy?.role})`}>Uploaded By: {m.uploadedBy?.name || 'Faculty'}</span>
                                    <span className="resource-date">Date: {new Date(m.date).toLocaleDateString()}</span>
                                  </div>

                                  <div className="resource-card-actions">
                                    <a 
                                      href={`${import.meta.env.VITE_API_URL}${m.fileUrl}`} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="resource-download-link student-download"
                                    >
                                      Download Resource
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Live Chat View */}
          {activeTab === 'chat' && (
            <div className="tab-section chat-section">
              <Chat socket={socket} onMessagesRead={fetchUnreadCount} />
            </div>
          )}

          {/* AI Assistant View */}
          {activeTab === 'ai-assistant' && (
            <div className="tab-section chat-section">
              <AIAssistant />
            </div>
          )}
          </div>

          {/* Page Footer */}
          <footer className="dashboard-footer">
            <p>&copy; 2026 CampusConnect. All Rights Reserved.</p>
          </footer>
        </div>
      </div>
      {showScrollTop && (
        <button 
          className="back-to-top-btn" 
          onClick={scrollToTop}
          title="Scroll to Top"
        >
          ▲
        </button>
      )}
    </div>
  );
};

export default StudentDashboard;

