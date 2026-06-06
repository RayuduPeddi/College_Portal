import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminLogin.css';

// Renders the Admin Login Page
const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/auth/forgot-password-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, secretKey, newPassword })
      });
      const result = await response.json();
      if (result.success) {
        setSuccessMessage('Password reset successfully! You can now login.');
        setForgotEmail('');
        setSecretKey('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowForgot(false);
          setSuccessMessage('');
        }, 2500);
      } else {
        setError(result.message || 'Reset password failed.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="login-container admin-login-bg">
      <div className="login-box card-shadow">
        {!showForgot ? (
          <>
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
              <div>
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="name@gmail.com"
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
              <div className="forgot-password-link-container">
                <button type="button" className="forgot-password-link" onClick={() => { setShowForgot(true); setError(''); setSuccessMessage(''); }}>
                  Forgot Password?
                </button>
              </div>
              <button type="submit" className="login-submit-btn">Login</button>
            </form>
          </>
        ) : (
          <>
            <h2>Reset Admin Password</h2>
            <form onSubmit={handleForgotPassword}>
              <div>
                <label>Admin Email</label>
                <input 
                  type="email" 
                  value={forgotEmail} 
                  onChange={(e) => setForgotEmail(e.target.value)} 
                  required 
                  placeholder="name@gmail.com"
                />
              </div>
              <div>
                <label>Security Code</label>
                <input 
                  type="text" 
                  value={secretKey} 
                  onChange={(e) => setSecretKey(e.target.value)} 
                  required 
                  placeholder="Enter admin security code"
                />
              </div>
              <div>
                <label>New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  placeholder="Enter new password (min 6 chars)"
                />
              </div>
              <div>
                <label>Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="Re-enter new password"
                />
              </div>
              <button type="submit" className="login-submit-btn" disabled={forgotLoading}>
                {forgotLoading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button type="button" className="back-btn" style={{ textDecoration: 'none', display: 'block', margin: '15px auto 0' }} onClick={() => { setShowForgot(false); setError(''); setSuccessMessage(''); }}>
                ← Back to Login
              </button>
            </form>
          </>
        )}
        {error && <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
        {successMessage && <div className="success-message" style={{ color: 'green', marginTop: '10px', fontWeight: '500' }}>{successMessage}</div>}
        {!showForgot && (
          <button className="back-btn" onClick={() => navigate('/')}>Back to Home</button>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
