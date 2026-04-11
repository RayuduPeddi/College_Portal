import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/StudentLogin.css';

// Renders the Student Login Page
const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Handles the login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('https://college-portal-k8yy.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || 'Login failed.');
        return;
      }

      // Check if the role matches
      if (result.data.user.role !== 'student') {
        setError('Access denied. You are not a student.');
        return;
      }

      // Save token and user details to local storage
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));

      // Redirect to the dashboard
      navigate('/student-dashboard');

    } catch (err) {
      setError('Network error. Please try again later.');
    }
  };

  return (
    <div className="login-container student-login-bg">
      <div className="login-box card-shadow student-theme">
        <h2>Student Login</h2>
        <form onSubmit={handleLogin}>
          <div>
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="Enter student email"
            />
          </div>
          <div>
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="Enter password"
            />
          </div>
          <button type="submit" className="login-submit-btn student-btn-color">Login</button>
        </form>
        {error && <div className="error-message">{error}</div>}
        <button className="back-btn" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );
};

export default StudentLogin;
