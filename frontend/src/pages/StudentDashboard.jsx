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

  // Sidebar Menu Configuration
  const menuItems = [
    { id: 'dashboard', label: 'My Dashboard' },
    { id: 'attendance', label: 'Attendance Records' },
    { id: 'marks', label: 'My Marks' }
  ];

  useEffect(() => {
    fetchProfile();
    fetchAttendance();
    fetchMarks();
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
                  <thead><tr><th>Date</th><th>Status</th><th>Marked By</th></tr></thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a._id}>
                        <td>{new Date(a.date).toLocaleDateString()}</td>
                        <td style={{ color: a.status === 'Present' ? 'green' : 'red', fontWeight: '600' }}>{a.status}</td>
                        <td>{a.teacherId?.name}</td>
                      </tr>
                    ))}
                    {attendance.length === 0 && <tr><td colSpan="3">No attendance records found.</td></tr>}
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

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
