import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student'); // 'student', 'teacher', 'admin'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || 'Login failed.');
        setLoading(false);
        return;
      }

      // Check role mapping consistency
      const userRole = result.data.user.role;
      if (userRole !== selectedRole) {
        setError(`Access denied. Account is registered as a ${userRole}, not a ${selectedRole}.`);
        setLoading(false);
        return;
      }

      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));

      if (userRole === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (userRole === 'teacher') {
        navigate('/teacher-dashboard', { replace: true });
      } else if (userRole === 'student') {
        navigate('/student-dashboard', { replace: true });
      } else {
        setError('Unknown user role. Contact administrator.');
      }

    } catch (err) {
      setError('Network error. Please verify the backend is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-landing-container split-layout">
      {/* Top Header Navbar */}
      <header className="portal-landing-header">
        <div className="header-brand">
          <span className="header-logo">🎓</span>
          <h2>CampusConnect</h2>
        </div>
      </header>

      {/* Main Split Content */}
      <div className="portal-split-main">
        {/* Left Panel: Academic Image Banner */}
        <div className="portal-left-panel">
          <div className="panel-overlay">
            <div className="panel-content">
              <h1>CampusConnect</h1>
              <p>Your academic gateway. Seamlessly access attendance, schedules, resources, and grades.</p>
            </div>
          </div>
        </div>

        {/* Right Panel: Clean Login Area */}
        <div className="portal-right-panel">
          {/* Centered Login Box */}
          <main className="portal-main-content simple-center">
            <div className="portal-login-card card-shadow simple-card no-borders">
              <div className="login-card-header">
                <h2>Account Login</h2>
                <p className="login-subtitle">Please select your role and sign in below</p>
              </div>

              {/* Role selection tabs */}
              <div className="login-role-tabs">
                <button 
                  className={`role-tab-btn ${selectedRole === 'student' ? 'active' : ''}`}
                  onClick={() => { setSelectedRole('student'); setError(''); }}
                >
                  Student
                </button>
                <button 
                  className={`role-tab-btn ${selectedRole === 'teacher' ? 'active' : ''}`}
                  onClick={() => { setSelectedRole('teacher'); setError(''); }}
                >
                  Teacher
                </button>
                <button 
                  className={`role-tab-btn ${selectedRole === 'admin' ? 'active' : ''}`}
                  onClick={() => { setSelectedRole('admin'); setError(''); }}
                >
                  Admin
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="portal-login-form">
                <div className="form-input-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="portal-input-container">
                    <input 
                      id="email"
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      placeholder="name@gmail.com"
                      className="input-with-icon-right"
                    />
                    <span className="input-icon-right">✉️</span>
                  </div>
                </div>

                <div className="form-input-group">
                  <label htmlFor="password">Password</label>
                  <div className="portal-input-container">
                    <input 
                      id="password"
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      placeholder="password"
                      className="input-with-icon-right"
                    />
                    <button 
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? 'Signing In...' : `Sign In`}
                </button>
              </form>

              {error && <div className="login-error-message">{error}</div>}
            </div>
          </main>

          {/* Footer for Rights Reserved */}
          <footer className="portal-footer simple-footer">
            <p>&copy; 2026 CampusConnect Portal. All Rights Reserved.</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Home;
