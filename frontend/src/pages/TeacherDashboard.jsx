import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import '../styles/TeacherDashboard.css';

// Teacher Dashboard Component
const TeacherDashboard = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [activeTab, setActiveTab] = useState('profile');
  const token = localStorage.getItem('token');

  const [profile, setProfile] = useState({});
  const [students, setStudents] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [marksHistory, setMarksHistory] = useState([]);
  const [notices, setNotices] = useState([]);

  // States for row-based inputs
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});

  const [marksSubject, setMarksSubject] = useState('');
  const [marksData, setMarksData] = useState({});

  // Sidebar Menu Configuration
  const menuItems = [
    { id: 'profile', label: 'My Profile' },
    { id: 'students', label: 'All Students' },
    { id: 'mark-attendance', label: 'Mark Attendance' },
    { id: 'view-attendance', label: 'My Authored Attendance' },
    { id: 'add-marks', label: 'Add Marks' },
    { id: 'view-marks', label: 'My Assigned Marks' },
    { id: 'notices', label: 'College Notices' }
  ];

  useEffect(() => {
    fetchProfile();
    fetchStudents();
    fetchMyAttendance();
    fetchMyMarks();
    fetchNotices();
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) {
        setProfile(result.data);
        if (result.data.subject) setMarksSubject(result.data.subject);
      }
    } catch (err) { console.log(err); }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher/students', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setStudents(result.data);
    } catch (err) { console.log(err); }
  };

  const fetchMyAttendance = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher/attendance', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setAttendanceHistory(result.data);
    } catch (err) { console.log(err); }
  };

  const fetchMyMarks = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher/marks', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setMarksHistory(result.data);
    } catch (err) { console.log(err); }
  };

  const fetchNotices = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher/notices', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setNotices(result.data);
    } catch (err) { console.log(err); }
  };

  // Submit attendance row
  const handleMarkAttendanceRow = async (studentUserId) => {
    const status = attendanceData[studentUserId] === false ? 'Absent' : 'Present'; // Default to Present if not specifically false
    try {
      const res = await fetch('http://localhost:5000/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentUserId, date: attendanceDate, status })
      });
      const result = await res.json();
      if (result.success) {
        alert('Attendance marked successfully!');
      } else {
        alert('Failed to mark attendance.');
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
      const res = await fetch('http://localhost:5000/api/teacher/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentUserId, subject: marksSubject, marks: marksVal, totalMarks: 100 })
      });
      const result = await res.json();
      if (result.success) {
        alert('Marks added successfully!');
        setMarksData({ ...marksData, [studentUserId]: '' });
      } else {
        alert('Failed to add marks.');
      }
    } catch (err) { console.log(err); }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="teacher" activeTab={activeTab} setActiveTab={setActiveTab} menuItems={menuItems} />

      <div className="main-content-area">
        <Navbar role="teacher" userName={user.name} />

        <div className="dashboard-content">

          {/* Profile View */}
          {activeTab === 'profile' && (
            <div className="tab-section">
              <h2>My Profile</h2>
              <div className="profile-card card-shadow outline-teacher">
                <p><strong>Name:</strong> {profile.userId?.name}</p>
                <p><strong>Email:</strong> {profile.userId?.email}</p>
                <p><strong>Subject:</strong> {profile.subject}</p>
                <p><strong>Department:</strong> {profile.department}</p>
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
                        <td>{s.userId?.name}</td><td>{s.userId?.email}</td>
                        <td>{s.rollNo}</td><td>{s.department}</td>
                      </tr>
                    ))}
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
                    <tr><th>Student Name</th><th>Roll No</th><th>Attendance (Present)</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id}>
                        <td>{s.userId?.name}</td>
                        <td>{s.rollNo}</td>
                        <td>
                          <input
                            type="checkbox"
                            style={{ width: '20px', height: '20px', margin: '0' }}
                            checked={attendanceData[s.userId?._id] !== false} // True by default
                            onChange={e => setAttendanceData({ ...attendanceData, [s.userId?._id]: e.target.checked })}
                          />
                        </td>
                        <td>
                          <button onClick={() => handleMarkAttendanceRow(s.userId?._id)} className="teacher-btn" style={{ padding: '6px 12px', minWidth: 'auto' }}>Save</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  <thead><tr><th>Date</th><th>Student Name</th><th>Student Email</th><th>Status</th></tr></thead>
                  <tbody>
                    {attendanceHistory.map(a => (
                      <tr key={a._id}>
                        <td>{new Date(a.date).toLocaleDateString()}</td>
                        <td>{a.studentId?.name}</td>
                        <td>{a.studentId?.email}</td>
                        <td style={{ color: a.status === 'Present' ? 'green' : 'red', fontWeight: '500' }}>{a.status}</td>
                      </tr>
                    ))}
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
                <strong style={{ fontSize: '18px', color: '#00796b' }}>Subject:</strong>
                <input type="text" value={marksSubject} onChange={e => setMarksSubject(e.target.value)} style={{ width: '200px', margin: 0 }} />
              </div>
              <div className="table-container card-shadow outline-teacher">
                <table>
                  <thead>
                    <tr><th>Student Name</th><th>Roll No</th><th>Marks Scored (out of 100)</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id}>
                        <td>{s.userId?.name}</td>
                        <td>{s.rollNo}</td>
                        <td>
                          <input
                            type="number"
                            placeholder="Marks"
                            style={{ width: '100px', margin: 0, padding: '5px' }}
                            value={marksData[s.userId?._id] || ''}
                            onChange={e => setMarksData({ ...marksData, [s.userId?._id]: e.target.value })}
                          />
                        </td>
                        <td>
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
                  <thead><tr><th>Student Name</th><th>Subject</th><th>Marks</th></tr></thead>
                  <tbody>
                    {marksHistory.map(m => (
                      <tr key={m._id}>
                        <td>{m.studentId?.name}</td>
                        <td>{m.subject}</td>
                        <td>{m.marks} / {m.totalMarks}</td>
                      </tr>
                    ))}
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

        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
