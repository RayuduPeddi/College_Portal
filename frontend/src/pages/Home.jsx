import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

// Displays the landing page with options to choose the role to login
const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Welcome to College Portal</h1>
        <p>Select your role to login into the system</p>
      </div>

      <div className="role-cards-container">
        <div className="role-card admin-card card-shadow" onClick={() => navigate('/admin-login')}>
          <h2>Admin</h2>
          <p>Manage students, teachers and system data.</p>
          <button className="login-nav-btn admin-btn">Login as Admin</button>
        </div>

        <div className="role-card teacher-card card-shadow" onClick={() => navigate('/teacher-login')}>
          <h2>Teacher</h2>
          <p>Mark attendance, evaluate students and add marks.</p>
          <button className="login-nav-btn teacher-btn">Login as Teacher</button>
        </div>

        <div className="role-card student-card card-shadow" onClick={() => navigate('/student-login')}>
          <h2>Student</h2>
          <p>View profile, attendance records, and academic marks.</p>
          <button className="login-nav-btn student-btn">Login as Student</button>
        </div>
      </div>
    </div>
  );
};

export default Home;
