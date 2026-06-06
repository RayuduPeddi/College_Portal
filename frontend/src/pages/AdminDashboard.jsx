import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Chat from '../components/Chat';
import AIAssistant from '../components/AIAssistant';
import { io } from 'socket.io-client';
import { SUBJECTS } from '../constants/subjects';
import { DashboardIcon, StudentsIcon, TeachersIcon, FolderIcon, NoticesIcon, ComplaintsIcon, MaterialsIcon, ChatIcon, AIIcon } from '../components/Icons';
import SearchableSelect from '../components/SearchableSelect';
import '../styles/AdminDashboard.css';

// Admin Dashboard Component
const AdminDashboard = () => {
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
      navigate('/admin-dashboard');
    } else {
      navigate(`/admin-dashboard/${tabId}`);
    }
  };

  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [unseenNotices, setUnseenNotices] = useState(0);
  const [unseenMaterials, setUnseenMaterials] = useState(0);
  const [unseenComplaints, setUnseenComplaints] = useState(0);

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [studentRecords, setStudentRecords] = useState({ attendance: [], marks: [] });
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Student editing states
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentEmail, setEditStudentEmail] = useState('');
  const [editStudentRollNo, setEditStudentRollNo] = useState('');
  const [editStudentDept, setEditStudentDept] = useState('');
  

  // Teacher editing states
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editTeacherEmail, setEditTeacherEmail] = useState('');
  const [editTeacherSubject, setEditTeacherSubject] = useState('');
  const [editTeacherDept, setEditTeacherDept] = useState('');
  

  // Profile self editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileEmail, setEditProfileEmail] = useState('');

  // Form states for adding Student
  const [newStudent, setNewStudent] = useState({ name: '', email: '', rollNo: '', department: '' });
  
  // Form states for adding Teacher
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', subject: '', department: '' });

  const [notices, setNotices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });

  // Material state variables
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
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon size={20} color="currentColor" /> },
    { id: 'students', label: 'Manage Students', icon: <StudentsIcon size={20} color="currentColor" /> },
    { id: 'teachers', label: 'Manage Teachers', icon: <TeachersIcon size={20} color="currentColor" /> },
    { id: 'records', label: 'Student Records', icon: <FolderIcon size={20} color="currentColor" /> },
    { id: 'notices', label: 'Manage Notices', icon: <NoticesIcon size={20} color="currentColor" />, badge: unseenNotices },
    { id: 'complaints', label: 'View Complaints', icon: <ComplaintsIcon size={20} color="currentColor" />, badge: unseenComplaints },
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

  // Fetch all initial data
  useEffect(() => {
    fetchStudents();
    fetchTeachers();
    fetchNotices();
    fetchComplaints();
    fetchMaterials();
  }, []);

  // Fetch all students from backend
  const fetchStudents = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/admin/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) setStudents(result.data);
    } catch (err) {
      console.log(err);
    }
  };

  // Fetch all teachers from backend
  const fetchTeachers = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/admin/teachers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) setTeachers(result.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchNotices = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/admin/notices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/admin/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/admin/materials', {
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


  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!materialFile) {
      alert('Please select a file to upload.');
      return;
    }
    if (!newMaterial.title || !newMaterial.subject) {
      alert('Please enter a Title and select a Subject.');
      return;
    }
    const formData = new FormData();
    formData.append('title', newMaterial.title);
    formData.append('description', newMaterial.description);
    formData.append('subject', newMaterial.subject);
    formData.append('file', materialFile);

    setMaterialUploading(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/admin/materials', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const result = await res.json();
      if (result.success) {
        alert('Material uploaded successfully!');
        setNewMaterial({ title: '', description: '', subject: '' });
        setMaterialFile(null);
        const fileInput = document.getElementById('admin-material-file');
        if (fileInput) fileInput.value = '';
        fetchMaterials();
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/materials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        alert('Material deleted.');
        fetchMaterials();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Add a new student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: newStudent.name,
          email: newStudent.email,
          rollNo: newStudent.rollNo,
          department: newStudent.department
        })
      });
      const result = await res.json();
      if (result.success) {
        alert('Student added successfully!');
        setNewStudent({ name: '', email: '', rollNo: '', department: '' });
        fetchStudents();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Delete a student
  const handleDeleteStudent = async (id) => {
    if(!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) fetchStudents();
    } catch (err) {
      console.log(err);
    }
  };

  // Add a new teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: newTeacher.name,
          email: newTeacher.email,
          subject: newTeacher.subject,
          department: newTeacher.department
        })
      });
      const result = await res.json();
      if (result.success) {
        alert('Teacher added successfully!');
        setNewTeacher({ name: '', email: '', subject: '', department: '' });
        fetchTeachers();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Delete a teacher
  const handleDeleteTeacher = async (id) => {
    if(!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/teachers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) fetchTeachers();
    } catch (err) {
      console.log(err);
    }
  };

  // Start editing a student
  const startEditStudent = (s) => {
    setEditingStudentId(s._id);
    setEditStudentName(s.userId?.name || '');
    setEditStudentEmail(s.userId?.email || '');
    setEditStudentRollNo(s.rollNo || '');
    setEditStudentDept(s.department || '');
    
  };

  // Save student edit
  const handleSaveStudentEdit = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: editStudentName,
          email: editStudentEmail,
          rollNo: editStudentRollNo,
          department: editStudentDept,
        })
      });
      const result = await res.json();
      if (result.success) {
        alert('Student details updated successfully!');
        setEditingStudentId(null);
        fetchStudents();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.log(err);
      alert('Error updating student details');
    }
  };

  // Start editing a teacher
  const startEditTeacher = (t) => {
    setEditingTeacherId(t._id);
    setEditTeacherName(t.userId?.name || '');
    setEditTeacherEmail(t.userId?.email || '');
    setEditTeacherSubject(t.subject || '');
    setEditTeacherDept(t.department || '');
    
  };

  // Save teacher edit
  const handleSaveTeacherEdit = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: editTeacherName,
          email: editTeacherEmail,
          subject: editTeacherSubject,
          department: editTeacherDept,
        })
      });
      const result = await res.json();
      if (result.success) {
        alert('Teacher details updated successfully!');
        setEditingTeacherId(null);
        fetchTeachers();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.log(err);
      alert('Error updating teacher details');
    }
  };

  // Start self-profile edit
  const startEditProfile = () => {
    setEditProfileName(user.name || '');
    setEditProfileEmail(user.email || '');
    setIsEditingProfile(true);
  };

  // Save self-profile edit
  const handleSaveProfileEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: editProfileName,
          email: editProfileEmail
        })
      });
      const result = await res.json();
      if (result.success) {
        alert('Profile updated successfully!');
        const updatedUser = { ...user, name: result.data.name, email: result.data.email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditingProfile(false);
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.log(err);
      alert('Error updating profile');
    }
  };

  // Fetch Attendance and Marks for selected student
  const fetchStudentRecords = async (userId, userName) => {
    try {
      setSelectedStudentName(userName);
      const [attendanceRes, marksRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/attendance/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/marks/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const attResult = await attendanceRes.json();
      const marResult = await marksRes.json();
      
      setStudentRecords({
        attendance: attResult.success ? attResult.data : [],
        marks: marResult.success ? marResult.data : []
      });
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddNotice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/admin/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newNotice)
      });
      const result = await res.json();
      if (result.success) {
        alert('Notice added successfully!');
        setNewNotice({ title: '', content: '' });
        fetchNotices();
      } else alert(result.message);
    } catch (err) { console.log(err); }
  };

  const handleDeleteNotice = async (id) => {
    if(!window.confirm('Delete this notice?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/notices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if ((await res.json()).success) fetchNotices();
    } catch (err) { console.log(err); }
  };

  const handleUpdateComplaintStatus = async (id, status) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/complaints/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if ((await res.json()).success) fetchComplaints();
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
        role="admin" 
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
          role="admin" 
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
            {activeTab === 'dashboard' && (
              <div className="admin-dashboard-overview">
                <h2>Dashboard Overview</h2>
                <div className="stats-grid">
                  <div className="stat-card card-shadow">
                    <h3>Total Students</h3>
                    <p className="stat-number">{students.length}</p>
                  </div>
                  <div className="stat-card card-shadow">
                    <h3>Total Teachers</h3>
                    <p className="stat-number">{teachers.length}</p>
                  </div>
                  <div className="stat-card card-shadow">
                    <h3>Unresolved Complaints</h3>
                    <p className="stat-number">{complaints.filter(c => c.status !== 'Resolved').length}</p>
                  </div>
                </div>
              </div>
            )}

          {/* Profile View */}
          {activeTab === 'profile' && (
            <div className="tab-section">
              <h2>My Profile</h2>
              <div className="profile-card card-shadow outline-admin" style={{ padding: '30px' }}>
                <div className="profile-pic-container">
                  <img 
                    src={getProfilePictureUrl()} 
                    alt="Profile" 
                    className="profile-avatar-large" 
                  />
                  <div className="profile-pic-upload-overlay">
                    <input 
                      type="file" 
                      id="admin-pic-input" 
                      style={{ display: 'none' }} 
                      accept="image/*" 
                      onChange={handleProfilePictureUpload}
                    />
                    <label htmlFor="admin-pic-input" className="profile-pic-upload-label">
                      Update Avatar
                    </label>
                  </div>
                </div>
                <div className="profile-details" style={{ marginTop: '20px' }}>
                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfileEdit}>
                      <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name</label>
                        <input 
                          required 
                          value={editProfileName} 
                          onChange={e => setEditProfileName(e.target.value)} 
                          style={{ width: '100%', maxWidth: '300px', margin: 0 }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email Address</label>
                        <input 
                          required 
                          type="email" 
                          value={editProfileEmail} 
                          onChange={e => setEditProfileEmail(e.target.value)} 
                          style={{ width: '100%', maxWidth: '300px', margin: 0 }}
                        />
                      </div>
                      <p style={{ marginBottom: '15px' }}><strong>Role:</strong> Administrator</p>
                      <button 
                        type="submit" 
                        className="action-btn" 
                        style={{ display: 'inline-block', marginRight: '10px' }}
                      >
                        Save Changes
                      </button>
                      <button 
                        type="button" 
                        className="delete-btn" 
                        style={{ display: 'inline-block', backgroundColor: '#666' }}
                        onClick={() => setIsEditingProfile(false)}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <p><strong>Name:</strong> {user.name}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Role:</strong> Administrator</p>
                      <button 
                        onClick={startEditProfile} 
                        className="action-btn"
                        style={{ marginTop: '15px', backgroundColor: '#008fd2' }}
                      >
                        Edit Profile
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manage Students View */}
          {activeTab === 'students' && (
            <div className="tab-section">
              <h2>Add New Student</h2>
              <form className="add-form card-shadow" onSubmit={handleAddStudent}>
                <input required placeholder="Name" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                <input required type="email" placeholder="Email" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} />
                {/* Password is managed by users; admins cannot set passwords */}
                <input required placeholder="Roll No" value={newStudent.rollNo} onChange={e => setNewStudent({...newStudent, rollNo: e.target.value})} />
                <input required placeholder="Department" value={newStudent.department} onChange={e => setNewStudent({...newStudent, department: e.target.value})} />
                <button type="submit" className="action-btn">Add Student</button>
              </form>

              <h2>All Students</h2>
              <div className="table-container card-shadow">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Roll No</th>
                      <th>Department</th>
                      {/* password column removed on purpose */}
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id}>
                        {editingStudentId === s._id ? (
                          <>
                            <td data-label="Name">
                              <input 
                                required 
                                value={editStudentName} 
                                onChange={e => setEditStudentName(e.target.value)} 
                                style={{ margin: 0, padding: '6px', fontSize: '13.5px', width: '100%' }}
                              />
                            </td>
                            <td data-label="Email">
                              <input 
                                required 
                                type="email" 
                                value={editStudentEmail} 
                                onChange={e => setEditStudentEmail(e.target.value)} 
                                style={{ margin: 0, padding: '6px', fontSize: '13.5px', width: '100%' }}
                              />
                            </td>
                            <td data-label="Roll No">
                              <input 
                                required 
                                value={editStudentRollNo} 
                                onChange={e => setEditStudentRollNo(e.target.value)} 
                                style={{ margin: 0, padding: '6px', fontSize: '13.5px', width: '100%' }}
                              />
                            </td>
                            <td data-label="Department">
                              <input 
                                required 
                                value={editStudentDept} 
                                onChange={e => setEditStudentDept(e.target.value)} 
                                style={{ margin: 0, padding: '6px', fontSize: '13.5px', width: '100%' }}
                              />
                            </td>
                            {/* password edit removed */}
                            <td data-label="Action">
                              <button 
                                onClick={() => handleSaveStudentEdit(s._id)} 
                                className="action-btn"
                                style={{ padding: '6px 12px', minWidth: 'auto', display: 'inline-block', marginRight: '5px', fontSize: '13px', height: 'auto' }}
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setEditingStudentId(null)} 
                                className="delete-btn"
                                style={{ padding: '6px 12px', minWidth: 'auto', display: 'inline-block', backgroundColor: '#666', fontSize: '13px', height: 'auto' }}
                              >
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td data-label="Name">{s.userId?.name}</td>
                            <td data-label="Email">{s.userId?.email}</td>
                            <td data-label="Roll No">{s.rollNo}</td>
                            <td data-label="Department">{s.department}</td>
                            {/* password hidden (admins cannot edit) */}
                            <td data-label="Action">
                              <button 
                                onClick={() => startEditStudent(s)} 
                                className="action-btn" 
                                style={{ padding: '6px 12px', minWidth: 'auto', display: 'inline-block', marginRight: '5px', fontSize: '13px', backgroundColor: '#008fd2', height: 'auto' }}
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteStudent(s._id)} 
                                className="delete-btn"
                                style={{ padding: '6px 12px', minWidth: 'auto', display: 'inline-block', fontSize: '13px', height: 'auto' }}
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No students registered. Please use the form above to add a student.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Manage Teachers View */}
          {activeTab === 'teachers' && (
            <div className="tab-section">
              <h2>Add New Teacher</h2>
              <form className="add-form card-shadow" onSubmit={handleAddTeacher}>
                <input required placeholder="Name" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} />
                <input required type="email" placeholder="Email" value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} />
                {/* Password is managed by users; admins cannot set passwords */}
                <div className="searchable-select-wrapper">
                  <SearchableSelect
                    options={SUBJECTS}
                    value={newTeacher.subject || ''}
                    onChange={(val) => setNewTeacher({ ...newTeacher, subject: val })}
                    placeholder="Search/Select Subject"
                    required
                  />
                </div>
                <input required placeholder="Department" value={newTeacher.department} onChange={e => setNewTeacher({...newTeacher, department: e.target.value})} />
                <button type="submit" className="action-btn">Add Teacher</button>
              </form>

              <h2>All Teachers</h2>
              <div className="table-container card-shadow">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Subject</th>
                      <th>Department</th>
                      {/* password column removed on purpose */}
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map(t => (
                      <tr key={t._id}>
                        {editingTeacherId === t._id ? (
                          <>
                            <td data-label="Name">
                              <input 
                                required 
                                value={editTeacherName} 
                                onChange={e => setEditTeacherName(e.target.value)} 
                                style={{ margin: 0, padding: '6px', fontSize: '13.5px', width: '100%' }}
                              />
                            </td>
                            <td data-label="Email">
                              <input 
                                required 
                                type="email" 
                                value={editTeacherEmail} 
                                onChange={e => setEditTeacherEmail(e.target.value)} 
                                style={{ margin: 0, padding: '6px', fontSize: '13.5px', width: '100%' }}
                              />
                            </td>
                            <td data-label="Subject">
                              <div style={{ minWidth: '150px' }}>
                                <SearchableSelect
                                  options={SUBJECTS}
                                  value={editTeacherSubject}
                                  onChange={(val) => setEditTeacherSubject(val)}
                                  placeholder="Select Subject..."
                                />
                              </div>
                            </td>
                            <td data-label="Department">
                              <input 
                                required 
                                value={editTeacherDept} 
                                onChange={e => setEditTeacherDept(e.target.value)} 
                                style={{ margin: 0, padding: '6px', fontSize: '13.5px', width: '100%' }}
                              />
                            </td>
                            {/* password edit removed */}
                            <td data-label="Action">
                              <button 
                                onClick={() => handleSaveTeacherEdit(t._id)} 
                                className="action-btn"
                                style={{ padding: '6px 12px', minWidth: 'auto', display: 'inline-block', marginRight: '5px', fontSize: '13px', height: 'auto' }}
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setEditingTeacherId(null)} 
                                className="delete-btn"
                                style={{ padding: '6px 12px', minWidth: 'auto', display: 'inline-block', backgroundColor: '#666', fontSize: '13px', height: 'auto' }}
                              >
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td data-label="Name">{t.userId?.name}</td>
                            <td data-label="Email">{t.userId?.email}</td>
                            <td data-label="Subject">{t.subject}</td>
                            <td data-label="Department">{t.department}</td>
                            {/* password hidden (admins cannot edit) */}
                            <td data-label="Action">
                              <button 
                                onClick={() => startEditTeacher(t)} 
                                className="action-btn" 
                                style={{ padding: '6px 12px', minWidth: 'auto', display: 'inline-block', marginRight: '5px', fontSize: '13px', backgroundColor: '#008fd2', height: 'auto' }}
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteTeacher(t._id)} 
                                className="delete-btn"
                                style={{ padding: '6px 12px', minWidth: 'auto', display: 'inline-block', fontSize: '13px', height: 'auto' }}
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {teachers.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No teachers registered. Please use the form above to add a teacher.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Student Records View */}
          {activeTab === 'records' && (
            <div className="tab-section">
              <h2>View Student Records</h2>
              <div className="select-container card-shadow" style={{ padding: '20px', marginBottom: '20px' }}>
                <p style={{ marginBottom: '10px', color: '#555', fontWeight: '500' }}>Select a student to view their attendance and marks:</p>
                <div style={{ maxWidth: '350px' }}>
                  <SearchableSelect
                    options={students.map(s => ({
                      label: `${s.userId?.name || ''} (${s.rollNo || ''})`,
                      value: s.userId?._id
                    }))}
                    value={selectedStudentId}
                    onChange={(val) => {
                      setSelectedStudentId(val);
                      const student = students.find(s => s.userId?._id === val);
                      if (student) {
                        fetchStudentRecords(student.userId._id, student.userId.name);
                      } else {
                        setSelectedStudentName('');
                      }
                    }}
                    placeholder="Search/Select Student..."
                  />
                </div>
              </div>

              {selectedStudentName && (
                <>
                  <h3>Attendance Records for {selectedStudentName}</h3>
                  <div className="table-container card-shadow">
                    <table>
                      <thead><tr><th>Date</th><th>Subject</th><th>Status</th><th>Marked By</th></tr></thead>
                      <tbody>
                        {studentRecords.attendance.map(a => (
                          <tr key={a._id}>
                            <td data-label="Date">{new Date(a.date).toLocaleDateString()}</td>
                            <td data-label="Subject">{a.subject || 'General'}</td>
                            <td data-label="Status" style={{ color: a.status === 'Present' ? 'green' : 'red' }}>{a.status}</td>
                            <td data-label="Marked By">{a.teacherId?.name}</td>
                          </tr>
                        ))}
                        {studentRecords.attendance.length === 0 && <tr><td colSpan="4">No attendance records found.</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  <h3 style={{ marginTop: '20px' }}>Marks Records for {selectedStudentName}</h3>
                  <div className="table-container card-shadow">
                    <table>
                      <thead><tr><th>Subject</th><th>Marks</th><th>Assigned By</th></tr></thead>
                      <tbody>
                        {studentRecords.marks.map(m => (
                          <tr key={m._id}>
                            <td data-label="Subject">{m.subject}</td>
                            <td data-label="Marks">{m.marks} / {m.totalMarks}</td>
                            <td data-label="Assigned By">{m.teacherId?.name}</td>
                          </tr>
                        ))}
                        {studentRecords.marks.length === 0 && <tr><td colSpan="3">No marks records found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="tab-section">
              <h2>Post a New Notice</h2>
              <form className="add-form card-shadow" onSubmit={handleAddNotice}>
                <input required placeholder="Notice Title" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} />
                <textarea required placeholder="Notice Content" value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})} />
                <button type="submit" className="action-btn">Post Notice</button>
              </form>

              <h2>All Notices</h2>
              <div className="table-container card-shadow">
                <table>
                  <thead><tr><th>Date</th><th>Title</th><th>Content</th><th>Action</th></tr></thead>
                  <tbody>
                    {notices.map(n => (
                      <tr key={n._id}>
                        <td data-label="Date">{new Date(n.date).toLocaleDateString()}</td>
                        <td data-label="Title">{n.title}</td>
                        <td data-label="Content">{n.content}</td>
                        <td data-label="Action"><button onClick={() => handleDeleteNotice(n._id)} className="delete-btn">Delete</button></td>
                      </tr>
                    ))}
                    {notices.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No notices posted yet. Please use the form above to post a notice.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'complaints' && (
            <div className="tab-section">
              <h2>Student Complaints</h2>
              <div className="table-container card-shadow">
                <table>
                  <thead><tr><th>Date</th><th>Student</th><th>Subject</th><th>Description</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {complaints.map(c => (
                      <tr key={c._id}>
                        <td data-label="Date">{new Date(c.date).toLocaleDateString()}</td>
                        <td data-label="Student">{c.studentId?.name} ({c.studentId?.email})</td>
                        <td data-label="Subject">{c.subject}</td>
                        <td data-label="Description">{c.description}</td>
                        <td data-label="Status">
                          <span className={`status-badge ${c.status?.toLowerCase()}`}>{c.status}</span>
                        </td>
                        <td data-label="Action">
                          <select value={c.status} onChange={(e) => handleUpdateComplaintStatus(c._id, e.target.value)} style={{ margin: 0, padding: '4px' }}>
                            <option value="Pending">Pending</option>
                            <option value="Reviewed">Reviewed</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {complaints.length === 0 && <tr><td colSpan="6">No complaints found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="tab-section">
              <div className="section-header-compact">
                <h2>Study Materials & Resources</h2>
                <p>Upload or manage lecture notes, guides, or course syllabus documents across the portal.</p>
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
                      onClick={() => document.getElementById('admin-material-file').click()}
                    >
                      <input 
                        id="admin-material-file" 
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
                          placeholder="e.g. UNIT-I" 
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
                                    <span className="resource-author" title={`${m.uploadedBy?.name} (${m.uploadedBy?.role})`}>Uploaded By: {m.uploadedBy?.name || 'Administrator'} ({m.uploadedBy?.role || 'Admin'})</span>
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

export default AdminDashboard;

