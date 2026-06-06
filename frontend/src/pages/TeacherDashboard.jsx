import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Chat from '../components/Chat';
import AIAssistant from '../components/AIAssistant';
import { io } from 'socket.io-client';
import { SUBJECTS } from '../constants/subjects';
import { StudentsIcon, MarksIcon, SearchIcon, PlusIcon, DashboardIcon, NoticesIcon, FolderIcon, ChatIcon, AIIcon } from '../components/Icons';
import SearchableSelect from '../components/SearchableSelect';
import '../styles/TeacherDashboard.css';

// Teacher Dashboard Component
const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [activeTab, setActiveTab] = useState(tab || 'profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab('profile');
    }
  }, [tab]);

  const navigateToTab = (tabId) => {
    if (tabId === 'profile') {
      navigate('/teacher-dashboard');
    } else {
      navigate(`/teacher-dashboard/${tabId}`);
    }
  };

  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [unseenNotices, setUnseenNotices] = useState(0);
  const [unseenMaterials, setUnseenMaterials] = useState(0);

  const [profile, setProfile] = useState({});
  const [students, setStudents] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [marksHistory, setMarksHistory] = useState([]);
  const [notices, setNotices] = useState([]);

  // States for row-based inputs
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});

  const [marksData, setMarksData] = useState({});

  const [editAttendanceState, setEditAttendanceState] = useState({});
  const [editMarksState, setEditMarksState] = useState({});

  // Study materials states
  const [materials, setMaterials] = useState([]);
  const [newMaterial, setNewMaterial] = useState({ title: '', description: '', subject: '' });
  const [materialFile, setMaterialFile] = useState(null);
  const [materialUploading, setMaterialUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setMaterialFile(e.dataTransfer.files[0]);
    }
  };

  // Sidebar Menu Configuration
  const menuItems = [
    { id: 'students', label: 'All Students', icon: <StudentsIcon size={20} color="currentColor" /> },
    { id: 'mark-attendance', label: 'Mark Attendance', icon: <MarksIcon size={20} color="currentColor" /> },
    { id: 'view-attendance', label: 'My Authored Attendance', icon: <SearchIcon size={20} color="currentColor" /> },
    { id: 'add-marks', label: 'Add Marks', icon: <PlusIcon size={20} color="currentColor" /> },
    { id: 'view-marks', label: 'My Assigned Marks', icon: <DashboardIcon size={20} color="currentColor" /> },
    { id: 'notices', label: 'College Notices', icon: <NoticesIcon size={20} color="currentColor" />, badge: unseenNotices },
    { id: 'materials', label: 'Upload Materials', icon: <FolderIcon size={20} color="currentColor" />, badge: unseenMaterials },
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

  useEffect(() => {
    fetchProfile();
    fetchStudents();
    fetchMyAttendance();
    fetchMyMarks();
    fetchNotices();
    fetchMyMaterials();
    fetchUnreadCount();
  }, [activeTab]);



  const fetchProfile = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/teacher/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) {
        setProfile(result.data);
      }
    } catch (err) { console.log(err); }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/teacher/students', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setStudents(result.data);
    } catch (err) { console.log(err); }
  };

  const fetchMyAttendance = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/teacher/attendance', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setAttendanceHistory(result.data);
    } catch (err) { console.log(err); }
  };

  const fetchMyMarks = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/teacher/marks', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setMarksHistory(result.data);
    } catch (err) { console.log(err); }
  };

  const fetchNotices = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/teacher/notices', { headers: { 'Authorization': `Bearer ${token}` } });
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

  const fetchMyMaterials = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/teacher/materials', {
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
    }
  }, [activeTab, notices.length, materials.length]);

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!materialFile) {
      alert('Please select a file to upload.');
      return;
    }
    if (!newMaterial.subject) {
      alert('Please select a Subject.');
      return;
    }
    const formData = new FormData();
    formData.append('title', newMaterial.title);
    formData.append('description', newMaterial.description);
    formData.append('subject', newMaterial.subject);
    formData.append('file', materialFile);

    setMaterialUploading(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/teacher/materials', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const result = await res.json();
      if (result.success) {
        alert('Material uploaded successfully!');
        setNewMaterial({ title: '', description: '', subject: '' });
        setMaterialFile(null);
        const fileInput = document.getElementById('teacher-material-file');
        if (fileInput) fileInput.value = '';
        fetchMyMaterials();
      } else {
        alert(result.message || 'Upload failed');
      }
    } catch (err) {
      console.log(err);
      alert('Error uploading file');
    } finally {
      setMaterialUploading(false);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study resource?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/materials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        alert('Material deleted.');
        fetchMyMaterials();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Submit bulk attendance
  const handleMarkBulkAttendance = async () => {
    const records = students.map(s => {
      const studentUserId = s.userId?._id;
      const status = attendanceData[studentUserId] === false ? 'Absent' : 'Present';
      return {
        studentUserId,
        date: attendanceDate,
        status,
        subject: profile.subject
      };
    });

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ records })
      });
      const result = await res.json();
      if (result.success) {
        alert('All attendance marked successfully!');
        fetchMyAttendance(); // refresh the authored history
      } else {
        alert(result.message || 'Failed to mark attendance.');
      }
    } catch (err) { console.log(err); }
  };

  // Submit marks row
  const handleAddMarksRow = async (studentUserId) => {
    const marksVal = marksData[studentUserId];
    if (!marksVal) {
      alert('Please enter marks before saving.');
      return;
    }
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/teacher/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentUserId, subject: profile.subject, marks: marksVal, totalMarks: 100 })
      });
      const result = await res.json();
      if (result.success) {
        alert('Marks added successfully!');
        setMarksData({ ...marksData, [studentUserId]: '' });
      } else {
        alert(result.message || 'Failed to add marks.');
      }
    } catch (err) { console.log(err); }
  };

  const handleEditAttendanceStatus = async (id, status) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/attendance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const result = await res.json();
      if (result.success) {
        alert('Attendance updated successfully!');
        fetchMyAttendance(); // refresh
      } else {
        alert('Failed to edit attendance: ' + result.message);
      }
    } catch (err) { console.log(err); }
  };

  const handleEditMarks = async (id, marks) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/marks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ marks })
      });
      const result = await res.json();
      if (result.success) {
        alert('Marks updated successfully!');
        fetchMyMarks(); // refresh
      } else {
        alert('Failed to edit marks: ' + result.message);
      }
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
        role="teacher" 
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
          role="teacher" 
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

            {/* Teacher Profile View */}
            {activeTab === 'profile' && (
              <div className="teacher-profile-wrapper">
                <h2>Welcome back, {user.name}!</h2>
                <div className="teacher-profile-card card-shadow outline-teacher">
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
                        id="teacher-pic-input" 
                        style={{ display: 'none' }} 
                        accept="image/*" 
                        onChange={handleProfilePictureUpload}
                      />
                      <label htmlFor="teacher-pic-input" className="profile-pic-upload-label">
                        Update Avatar
                      </label>
                    </div>
                  </div>
                  <div className="profile-details" style={{ marginTop: '20px' }}>
                    <p><strong>Name:</strong> {profile.userId?.name}</p>
                    <p><strong>Email:</strong> {profile.userId?.email}</p>
                    <p><strong>Subject:</strong> {profile.subject}</p>
                    <p><strong>Department:</strong> {profile.department}</p>
                  </div>
                </div>
              </div>
            )}

          {/* All Students View */}
          {activeTab === 'students' && (
            <div className="tab-section">
              <h2>All Students List</h2>
              <div className="table-container card-shadow outline-teacher">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Roll No</th><th>Department</th></tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id}>
                        <td data-label="Name">{s.userId?.name}</td>
                        <td data-label="Email">{s.userId?.email}</td>
                        <td data-label="Roll No">{s.rollNo}</td>
                        <td data-label="Department">{s.department}</td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No students are registered in the portal yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mark Attendance Form View */}
          {activeTab === 'mark-attendance' && (
            <div className="tab-section">
              <h2>Mark Attendance</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <strong style={{ fontSize: '18px', color: '#00796b' }}>Subject: {profile.subject}</strong>
                <div>
                  <label style={{ marginRight: '10px' }}>Date:</label>
                  <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} style={{ width: 'auto', margin: 0 }} />
                </div>
              </div>
              <div className="table-container card-shadow outline-teacher">
                <table>
                  <thead>
                    <tr><th>Student Name</th><th>Roll No</th><th>Attendance (Present)</th></tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id}>
                        <td data-label="Student Name">{s.userId?.name}</td>
                        <td data-label="Roll No">{s.rollNo}</td>
                        <td data-label="Attendance (Present)">
                          <input
                            type="checkbox"
                            style={{ width: '20px', height: '20px', margin: '0' }}
                            checked={attendanceData[s.userId?._id] !== false} 
                            onChange={e => setAttendanceData({ ...attendanceData, [s.userId?._id]: e.target.checked })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button onClick={handleMarkBulkAttendance} className="primary-btn teacher-btn" style={{ fontSize: '16px', padding: '10px 30px' }}>
                  Save All Attendance
                </button>
              </div>
            </div>
          )}

          {/* Authored Attendance View */}
          {activeTab === 'view-attendance' && (
            <div className="tab-section">
              <h2>My Authored Attendance</h2>
              <strong style={{ fontSize: '16px', color: '#555', display: 'block', marginBottom: '10px' }}>Subject: {profile.subject}</strong>
              <div className="table-container card-shadow outline-teacher">
                <table>
                  <thead><tr><th>Date</th><th>Student Name</th><th>Student Email</th><th>Status</th><th>Edit Action</th></tr></thead>
                  <tbody>
                    {attendanceHistory.map(a => (
                      <tr key={a._id}>
                        <td data-label="Date">{new Date(a.date).toLocaleDateString()}</td>
                        <td data-label="Student Name">{a.studentId?.name}</td>
                        <td data-label="Student Email">{a.studentId?.email}</td>
                        <td data-label="Status" style={{ color: a.status === 'Present' ? 'green' : 'red', fontWeight: '500' }}>{a.status}</td>
                        <td data-label="Edit Action">
                          <select 
                            defaultValue={a.status} 
                            onChange={(e) => setEditAttendanceState({...editAttendanceState, [a._id]: e.target.value})}
                            style={{ margin: 0, width: '120px', padding: '5px', display: 'inline-block' }}
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                          </select>
                          <button 
                            className="teacher-btn" 
                            style={{ padding: '6px 12px', marginLeft: '10px', minWidth: 'auto', display: 'inline-block' }}
                            onClick={() => handleEditAttendanceStatus(a._id, editAttendanceState[a._id] || a.status)}
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    ))}
                    {attendanceHistory.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No authored attendance records have been added yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add Marks Form View */}
          {activeTab === 'add-marks' && (
            <div className="tab-section">
              <h2>Add Student Marks</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <strong style={{ fontSize: '18px', color: '#00796b' }}>Subject: {profile.subject}</strong>
              </div>
              <div className="table-container card-shadow outline-teacher">
                <table>
                  <thead>
                    <tr><th>Student Name</th><th>Roll No</th><th>Marks Scored (out of 100)</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id}>
                        <td data-label="Student Name">{s.userId?.name}</td>
                        <td data-label="Roll No">{s.rollNo}</td>
                        <td data-label="Marks Scored (out of 100)">
                          <input
                            type="number"
                            placeholder="Marks"
                            style={{ width: '100px', margin: 0, padding: '5px' }}
                            value={marksData[s.userId?._id] || ''}
                            onChange={e => setMarksData({ ...marksData, [s.userId?._id]: e.target.value })}
                          />
                        </td>
                        <td data-label="Action">
                          <button onClick={() => handleAddMarksRow(s.userId?._id)} className="teacher-btn" style={{ padding: '6px 12px', minWidth: 'auto' }}>Save</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Assigned Marks View */}
          {activeTab === 'view-marks' && (
            <div className="tab-section">
              <h2>Marks Assigned by Me</h2>
              <strong style={{ fontSize: '16px', color: '#555', display: 'block', marginBottom: '10px' }}>Subject: {profile.subject}</strong>
              <div className="table-container card-shadow outline-teacher">
                <table>
                  <thead><tr><th>Student Name</th><th>Subject</th><th>Total Marks</th><th>Assigned Marks</th><th>Edit Marks</th></tr></thead>
                  <tbody>
                    {marksHistory.map(m => (
                      <tr key={m._id}>
                        <td data-label="Student Name">{m.studentId?.name}</td>
                        <td data-label="Subject">{m.subject}</td>
                        <td data-label="Total Marks">{m.totalMarks}</td>
                        <td data-label="Assigned Marks" style={{ fontWeight: 'bold', color: '#00796b' }}>{m.marks}</td>
                        <td data-label="Edit Marks">
                          <input 
                            type="number" 
                            defaultValue={m.marks} 
                            onChange={(e) => setEditMarksState({...editMarksState, [m._id]: e.target.value})}
                            style={{ width: '80px', margin: 0, padding: '5px', display: 'inline-block' }}
                          />
                          <button 
                            className="teacher-btn" 
                            style={{ padding: '6px 12px', marginLeft: '10px', minWidth: 'auto', display: 'inline-block' }}
                            onClick={() => handleEditMarks(m._id, editMarksState[m._id] || m.marks)}
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    ))}
                    {marksHistory.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No academic marks have been assigned yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="tab-section">
              <h2>College Notices</h2>
              <div className="table-container card-shadow outline-teacher">
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

          {activeTab === 'materials' && (
            <div className="tab-section">
              <div className="section-header-compact">
                <h2>Study Materials & Resources</h2>
                <p>Upload lecture notes, guides, or course syllabus documents for students to download.</p>
              </div>
              
              <div className="resource-upload-card card-shadow">
                <form onSubmit={handleUploadMaterial} className="resource-upload-form">
                  <div className="resource-upload-grid">
                    {/* Left side: Drag & drop select area */}
                    <div 
                      className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${materialFile ? 'has-file' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('teacher-material-file').click()}
                    >
                      <input 
                        id="teacher-material-file" 
                        type="file" 
                        style={{ display: 'none' }}
                        onChange={e => setMaterialFile(e.target.files[0])} 
                      />
                      
                      {!materialFile ? (
                        <div className="dropzone-content">
                          <span className="dropzone-title">Drag & drop your file here</span>
                          <span className="dropzone-subtitle">or click to browse from device</span>
                          <span className="dropzone-limits">Supports documents, slides, and zip files (Max 10MB)</span>
                        </div>
                      ) : (
                        <div className="dropzone-file-preview">
                          <div className="file-preview-info">
                            <span className="file-preview-name">{materialFile.name}</span>
                            <span className="file-preview-size">{(materialFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                          </div>
                          <button 
                            type="button" 
                            className="file-clear-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMaterialFile(null);
                            }}
                            title="Remove file"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right side: form inputs */}
                    <div className="resource-form-fields">
                      <div className="form-group">
                        <label htmlFor="resource-title">Resource Title</label>
                        <input 
                          id="resource-title"
                          required 
                          placeholder="e.g. Calculus Lesson 1 - Intro to Derivatives" 
                          value={newMaterial.title} 
                          onChange={e => setNewMaterial({...newMaterial, title: e.target.value})} 
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="resource-subject">Subject</label>
                        <SearchableSelect
                          options={SUBJECTS}
                          value={newMaterial.subject || ''}
                          onChange={(val) => setNewMaterial({ ...newMaterial, subject: val })}
                          placeholder="Type to search subject..."
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="resource-desc">Description</label>
                        <textarea 
                          id="resource-desc"
                          placeholder="Provide a brief summary of what is covered in this resource..." 
                          rows="2"
                          value={newMaterial.description} 
                          onChange={e => setNewMaterial({...newMaterial, description: e.target.value})} 
                        />
                      </div>
                      
                      <button type="submit" className="submit-resource-btn" disabled={materialUploading || !materialFile}>
                        {materialUploading ? 'Uploading...' : 'Publish Material'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="subject-search-container" style={{ marginTop: '40px' }}>
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

              <h2 style={{ marginTop: '30px', marginBottom: '20px' }}>Published Resources ({materials.length})</h2>
              
              {materials.length === 0 ? (
                <div className="no-resources-state card-shadow">
                  <p>No study materials uploaded yet. Use the form above to upload academic resources.</p>
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
                                    <span className="resource-file-name" title={m.fileName}>File: {m.fileName}</span>
                                    <span className="resource-date">Date: {new Date(m.date).toLocaleDateString()}</span>
                                  </div>

                                  <div className="resource-card-actions">
                                    <a 
                                      href={`${import.meta.env.VITE_API_URL}${m.fileUrl}`} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="resource-download-link"
                                    >
                                      Download
                                    </a>
                                    <button 
                                      onClick={() => handleDeleteMaterial(m._id)} 
                                      className="resource-delete-btn"
                                      title="Delete material"
                                    >
                                      Delete
                                    </button>
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

export default TeacherDashboard;

