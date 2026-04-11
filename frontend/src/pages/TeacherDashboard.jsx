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

  // Form states
  const [attendanceForm, setAttendanceForm] = useState({ studentUserId: '', date: '', status: 'Present' });
  const [marksForm, setMarksForm] = useState({ studentUserId: '', subject: '', marks: '', totalMarks: 100 });

  // Sidebar Menu Configuration
  const menuItems = [
    { id: 'profile', label: 'My Profile' },
    { id: 'students', label: 'All Students' },
    { id: 'mark-attendance', label: 'Mark Attendance' },
    { id: 'view-attendance', label: 'My Authored Attendance' },
    { id: 'add-marks', label: 'Add Marks' },
    { id: 'view-marks', label: 'My Assigned Marks' }
  ];

  useEffect(() => {
    fetchProfile();
    fetchStudents();
    fetchMyAttendance();
    fetchMyMarks();
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setProfile(result.data);
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

  // Submit attendance form
  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(attendanceForm)
      });
      const result = await res.json();
      if (result.success) {
        alert('Attendance marked successfully!');
        setAttendanceForm({ ...attendanceForm, studentUserId: '' });
      } else {
        alert('Failed to mark attendance.');
      }
    } catch (err) { console.log(err); }
  };

  // Submit marks form
  const handleAddMarks = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/teacher/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(marksForm)
      });
      const result = await res.json();
      if (result.success) {
        alert('Marks added successfully!');
        setMarksForm({ ...marksForm, studentUserId: '', marks: '' });
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
              <form className="teacher-form card-shadow outline-teacher" onSubmit={handleMarkAttendance}>
                <label>Select Student</label>
                <select required value={attendanceForm.studentUserId} onChange={e => setAttendanceForm({...attendanceForm, studentUserId: e.target.value})}>
                  <option value="" disabled>-- Select a student --</option>
                  {students.map(s => <option key={s._id} value={s.userId?._id}>{s.userId?.name} ({s.rollNo})</option>)}
                </select>

                <label>Date</label>
                <input required type="date" value={attendanceForm.date} onChange={e => setAttendanceForm({...attendanceForm, date: e.target.value})} />

                <label>Status</label>
                <select required value={attendanceForm.status} onChange={e => setAttendanceForm({...attendanceForm, status: e.target.value})}>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>

                <button type="submit" className="teacher-btn">Submit Attendance</button>
              </form>
            </div>
          )}

          {/* Authored Attendance View */}
          {activeTab === 'view-attendance' && (
            <div className="tab-section">
              <h2>My Authored Attendance</h2>
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
              <form className="teacher-form card-shadow outline-teacher" onSubmit={handleAddMarks}>
                <label>Select Student</label>
                <select required value={marksForm.studentUserId} onChange={e => setMarksForm({...marksForm, studentUserId: e.target.value})}>
                  <option value="" disabled>-- Select a student --</option>
                  {students.map(s => <option key={s._id} value={s.userId?._id}>{s.userId?.name} ({s.rollNo})</option>)}
                </select>

                <label>Subject</label>
                <input required type="text" placeholder="E.g., Mathematics" value={marksForm.subject} onChange={e => setMarksForm({...marksForm, subject: e.target.value})} />

                <label>Marks Scored</label>
                <input required type="number" placeholder="Out of 100" value={marksForm.marks} onChange={e => setMarksForm({...marksForm, marks: e.target.value})} />

                <button type="submit" className="teacher-btn">Add Marks</button>
              </form>
            </div>
          )}

          {/* Assigned Marks View */}
          {activeTab === 'view-marks' && (
            <div className="tab-section">
              <h2>Marks Assigned by Me</h2>
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

        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
