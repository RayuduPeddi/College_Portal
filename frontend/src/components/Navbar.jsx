import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

// Renders the top navigation bar with user details and logout functionality
const Navbar = ({ role, userName }) => {
  const navigate = useNavigate();

  // Handles logging out the user by clearing local storage and redirecting
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav className={`navbar role-${role}`}>
      <div className="navbar-left">
        <h2>College Portal</h2>
      </div>
      <div className="navbar-right">
        <span className="user-name">Welcome, {userName || 'User'}</span>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;