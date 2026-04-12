import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import { useState } from 'react';

// Displays a beautiful Landing Page for the College
const Home = () => {
  const navigate = useNavigate();
  const [showLoginOptions, setShowLoginOptions] = useState(false);

  return (
    <div className="landing-container">
      {/* Navigation Bar */}
      <nav className="landing-navbar">
        <div className="landing-logo">
          🎓 CampusConnect Portal
        </div>
        <div className="landing-nav-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <button className="cta-btn" onClick={() => setShowLoginOptions(true)}>Login</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <h1>Empowering the Next Generation of Innovators</h1>
          <p>
            Experience seamless communication, real-time tracking, and comprehensive academic tools designed for students, teachers, and administrators.
          </p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={() => setShowLoginOptions(true)}>Get Started</button>
            <a href="#features" className="secondary-btn">Explore Features</a>
          </div>
        </div>
        <div className="hero-image">
          <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="College Campus" />
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2>Why Choose Our Portal?</h2>
        <div className="features-grid">
          <div className="feature-card card-shadow">
            <h3>🏫 Centralized Administration</h3>
            <p>Administer student and teacher records securely in one place. Resolve complaints swiftly.</p>
          </div>
          <div className="feature-card card-shadow">
            <h3>👨‍🏫 Empowered Teachers</h3>
            <p>Seamlessly upload marks, manage attendance, and distribute assignments without hassle.</p>
          </div>
          <div className="feature-card card-shadow">
            <h3>🎓 Student Access</h3>
            <p>Students can track their progress, view attendance, and keep up with college notices.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 CampusConnect Portal. All rights reserved.</p>
        <p className="designer-tag">Designed by <strong>PEDDI RAYUDU</strong></p>
      </footer>

      {/* Login Options Modal */}
      {showLoginOptions && (
        <div className="login-modal-overlay" onClick={() => setShowLoginOptions(false)}>
          <div className="login-modal card-shadow" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowLoginOptions(false)}>×</button>
            <h2>Select Your Role</h2>
            <p>Choose your portal login to proceed</p>
            <div className="role-cards-container">
              <div className="role-card admin-card card-shadow" onClick={() => navigate('/admin-login')}>
                <h2>Admin</h2>
                <button className="login-nav-btn admin-btn">Login as Admin</button>
              </div>

              <div className="role-card teacher-card card-shadow" onClick={() => navigate('/teacher-login')}>
                <h2>Teacher</h2>
                <button className="login-nav-btn teacher-btn">Login as Teacher</button>
              </div>

              <div className="role-card student-card card-shadow" onClick={() => navigate('/student-login')}>
                <h2>Student</h2>
                <button className="login-nav-btn student-btn">Login as Student</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
