import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import '../styles/StudentDashboard.css';

// Student Dashboard Component
const StudentDashboard = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [activeTab, setActiveTab] = useState('dashboard');
  const token = localStorage.getItem('token');

  const [profile, setProfile] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [notices, setNotices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [newComplaint, setNewComplaint] = useState({ subject: '', description: '' });

  // Sidebar Menu Configuration
  const menuItems = [
    { id: 'dashboard', label: 'My Dashboard' },
    { id: 'attendance', label: 'Attendance Records' },
    { id: 'marks', label: 'My Marks' },
    { id: 'notices', label: 'Notices' },
    { id: 'complaints', label: 'My Complaints' }
  ];

  useEffect(() => {
    fetchProfile();
    fetchAttendance();
    fetchMarks();
    fetchNotices();
    fetchComplaints();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setProfile(result.data);
    } catch (err) { console.log(err); }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/attendance', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setAttendance(result.data);
    } catch (err) { console.log(err); }
  };

  const fetchMarks = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/marks', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setMarks(result.data);
    } catch (err) { console.log(err); }
  };

  const fetchNotices = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/notices', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setNotices(result.data);
    } catch (err) { console.log(err); }
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/complaints', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setComplaints(result.data);
    } catch (err) { console.log(err); }
  };

  const handleAddComplaint = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/student/complaints', {
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

  // Calculate attendance percentage
  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0;
    const presentDays = attendance.filter(a => a.status === 'Present').length;
    return ((presentDays / attendance.length) * 100).toFixed(1);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="student" activeTab={activeTab} setActiveTab={setActiveTab} menuItems={menuItems} />
      
      <div className="main-content-area">
        <Navbar role="student" userName={user.name} />
        
        <div className="dashboard-content">

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
                        <td>{new Date(a.date).toLocaleDateString()}</td>
                        <td>{a.subject || 'General'}</td>
                        <td style={{ color: a.status === 'Present' ? 'green' : 'red', fontWeight: '600' }}>{a.status}</td>
                        <td>{a.teacherId?.name}</td>
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
                        <td>{m.subject}</td>
                        <td style={{ fontWeight: '600', color: '#4a148c' }}>{m.marks}</td>
                        <td>{m.totalMarks}</td>
                        <td>{m.teacherId?.name}</td>
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
                        <td>{new Date(n.date).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 'bold' }}>{n.title}</td>
                        <td>{n.content}</td>
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
                        <td>{new Date(c.date).toLocaleDateString()}</td>
                        <td>{c.subject}</td>
                        <td>{c.description}</td>
                        <td><span className={`status-badge ${c.status?.toLowerCase()}`}>{c.status}</span></td>
                      </tr>
                    ))}
                    {complaints.length === 0 && <tr><td colSpan="4">No complaints raised yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
