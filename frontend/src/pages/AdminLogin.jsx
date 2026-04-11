import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminLogin.css';

// Renders the Admin Login Page
const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Handles the login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/auth/login', {
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
      if (result.data.user.role !== 'admin') {
        setError('Access denied. You are not an admin.');
        return;
      }

      // Save token and user details to local storage
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));

      // Redirect to the dashboard
      navigate('/admin-dashboard');

    } catch (err) {
      setError('Network error. Please try again later.');
    }
  };

  return (
    <div className="login-container admin-login-bg">
      <div className="login-box card-shadow">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div>
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="Enter admin email"
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
          <button type="submit" className="login-submit-btn">Login</button>
        </form>
        {error && <div className="error-message">{error}</div>}
        <button className="back-btn" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );
};

export default AdminLogin;
