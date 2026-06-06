import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      // Save token and user details to local storage
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));

      // Redirect automatically based on role
      const role = result.data.user.role;
      if (role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (role === 'teacher') {
        navigate('/teacher-dashboard', { replace: true });
      } else if (role === 'student') {
        navigate('/student-dashboard', { replace: true });
      } else {
        setError('Unknown user role. Contact administrator.');
      }

    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card-wrapper">
        <div className="login-brand-container">
          <svg className="login-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
          </svg>
          <span className="login-brand-text">CampusConnect</span>
        </div>

        <h2>Welcome Back</h2>
        <p className="login-subtitle">Sign in to access your portal dashboard</p>

        <form onSubmit={handleLogin} className="login-form-element">
          <div className="form-group-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@gmail.com"
            />
          </div>
          <div className="form-group-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="password"
            />
          </div>
          <button type="submit" className="login-action-btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {error && <div className="login-error-msg">{error}</div>}

        <button className="login-back-home-btn" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/') }>
          Back to Previous
        </button>
      </div>
    </div>
  );
};

export default Login;
