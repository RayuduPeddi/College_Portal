import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import '../styles/AdminDashboard.css';

// Admin Dashboard Component
const AdminDashboard = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [activeTab, setActiveTab] = useState('dashboard');
  const token = localStorage.getItem('token');

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [studentRecords, setStudentRecords] = useState({ attendance: [], marks: [] });
  const [selectedStudentName, setSelectedStudentName] = useState('');

  // Form states for adding Student
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '', rollNo: '', department: '' });
  
  // Form states for adding Teacher
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '', subject: '', department: '' });

  const [notices, setNotices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });

  // Sidebar Menu Configuration
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'students', label: 'Manage Students' },
    { id: 'teachers', label: 'Manage Teachers' },
    { id: 'records', label: 'Student Records' },
    { id: 'notices', label: 'Manage Notices' },
    { id: 'complaints', label: 'View Complaints' }
  ];

  // Fetch all initial data
  useEffect(() => {
    fetchStudents();
    fetchTeachers();
    fetchNotices();
    fetchComplaints();
  }, []);

  // Fetch all students from backend
  const fetchStudents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/students', {
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
      const res = await fetch('http://localhost:5000/api/admin/teachers', {
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
      const res = await fetch('http://localhost:5000/api/admin/notices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) setNotices(result.data);
    } catch (err) { console.log(err); }
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) setComplaints(result.data);
    } catch (err) { console.log(err); }
  };

  // Add a new student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newStudent)
      });
      const result = await res.json();
      if (result.success) {
        alert('Student added successfully!');
        setNewStudent({ name: '', email: '', password: '', rollNo: '', department: '' });
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
      const res = await fetch(`http://localhost:5000/api/admin/students/${id}`, {
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
      const res = await fetch('http://localhost:5000/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newTeacher)
      });
      const result = await res.json();
      if (result.success) {
        alert('Teacher added successfully!');
        setNewTeacher({ name: '', email: '', password: '', subject: '', department: '' });
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
      const res = await fetch(`http://localhost:5000/api/admin/teachers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) fetchTeachers();
    } catch (err) {
      console.log(err);
    }
  };

  // Fetch Attendance and Marks for selected student
  const fetchStudentRecords = async (userId, userName) => {
    try {
      setSelectedStudentName(userName);
      const [attendanceRes, marksRes] = await Promise.all([
        fetch(`http://localhost:5000/api/admin/attendance/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`http://localhost:5000/api/admin/marks/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } })
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
      const res = await fetch('http://localhost:5000/api/admin/notices', {
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
      const res = await fetch(`http://localhost:5000/api/admin/notices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if ((await res.json()).success) fetchNotices();
    } catch (err) { console.log(err); }
  };

  const handleUpdateComplaintStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/complaints/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if ((await res.json()).success) fetchComplaints();
    } catch (err) { console.log(err); }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" activeTab={activeTab} setActiveTab={setActiveTab} menuItems={menuItems} />
      
      <div className="main-content-area">
        <Navbar role="admin" userName={user.name} />
        
        <div className="dashboard-content">
          
          {/* Dashboard Hub View */}
          {activeTab === 'dashboard' && (
            <div>
              <h2>Admin Dashboard</h2>
              <div className="stats-container">
                <div className="stat-card card-shadow">
                  <h3>Total Students</h3>
                  <p className="stat-number">{students.length}</p>
                </div>
                <div className="stat-card card-shadow">
                  <h3>Total Teachers</h3>
                  <p className="stat-number">{teachers.length}</p>
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
                <input required type="password" placeholder="Password" value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} />
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
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id}>
                        <td>{s.userId?.name}</td>
                        <td>{s.userId?.email}</td>
                        <td>{s.rollNo}</td>
                        <td>{s.department}</td>
                        <td>
                          <button onClick={() => handleDeleteStudent(s._id)} className="delete-btn">Delete</button>
                        </td>
                      </tr>
                    ))}
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
                <input required type="password" placeholder="Password" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} />
                <input required placeholder="Subject" value={newTeacher.subject} onChange={e => setNewTeacher({...newTeacher, subject: e.target.value})} />
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
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map(t => (
                      <tr key={t._id}>
                        <td>{t.userId?.name}</td>
                        <td>{t.userId?.email}</td>
                        <td>{t.subject}</td>
                        <td>{t.department}</td>
                        <td>
                          <button onClick={() => handleDeleteTeacher(t._id)} className="delete-btn">Delete</button>
                        </td>
                      </tr>
                    ))}
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
                <p>Select a student to view their attendance and marks:</p>
                <select onChange={(e) => {
                  const student = students.find(s => s.userId._id === e.target.value);
                  if (student) fetchStudentRecords(student.userId._id, student.userId.name);
                }} defaultValue="">
                  <option value="" disabled>-- Choose a student --</option>
                  {students.map(s => (
                    <option key={s._id} value={s.userId?._id}>{s.userId?.name} ({s.rollNo})</option>
                  ))}
                </select>
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
                            <td>{new Date(a.date).toLocaleDateString()}</td>
                            <td>{a.subject || 'General'}</td>
                            <td style={{ color: a.status === 'Present' ? 'green' : 'red' }}>{a.status}</td>
                            <td>{a.teacherId?.name}</td>
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
                            <td>{m.subject}</td>
                            <td>{m.marks} / {m.totalMarks}</td>
                            <td>{m.teacherId?.name}</td>
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
                        <td>{new Date(n.date).toLocaleDateString()}</td>
                        <td>{n.title}</td>
                        <td>{n.content}</td>
                        <td><button onClick={() => handleDeleteNotice(n._id)} className="delete-btn">Delete</button></td>
                      </tr>
                    ))}
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
                        <td>{new Date(c.date).toLocaleDateString()}</td>
                        <td>{c.studentId?.name} ({c.studentId?.email})</td>
                        <td>{c.subject}</td>
                        <td>{c.description}</td>
                        <td>
                          <span className={`status-badge ${c.status?.toLowerCase()}`}>{c.status}</span>
                        </td>
                        <td>
                          <select value={c.status} onChange={(e) => handleUpdateComplaintStatus(c._id, e.target.value)}>
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

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
