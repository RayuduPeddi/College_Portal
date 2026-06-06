import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatIcon, AIIcon, MaterialsIcon, FolderIcon, UserIcon } from './Icons';
import '../styles/Navbar.css';

// Renders the top navigation bar with user details, profile dropdown, and password change modal
const Navbar = ({ role, userName, userProfilePicture, onMenuToggle, setActiveTab, unreadCount, unseenMaterials }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  


  useEffect(() => {
    const closeDropdowns = (e) => {
      if (!e.target.closest('.navbar-profile-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleMyProfile = () => {
    if (role === 'student') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('profile');
    }
    setDropdownOpen(false);
  };

  const openChangePassword = () => {
    setChangePwdOpen(true);
    setDropdownOpen(false);
    setPwdError('');
    setPwdSuccess('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const closeChangePassword = () => {
    setChangePwdOpen(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError('All fields are required');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirmation do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const result = await res.json();
      if (result.success) {
        setPwdSuccess(result.message || 'Password changed successfully');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setTimeout(() => { setChangePwdOpen(false); setPwdSuccess(''); }, 1500);
      } else {
        setPwdError(result.message || 'Failed to change password');
      }
    } catch (err) {
      console.error(err);
      setPwdError('Server error while changing password');
    }
  };

  const getProfilePictureUrl = () => {
    if (userProfilePicture) {
      return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${userProfilePicture}`;
    }
    return 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  };



  return (
    <>
      <nav className={`navbar role-${role}`}>
        <div className="navbar-left">
          <button className="hamburger-menu-btn" onClick={onMenuToggle} aria-label="Toggle Menu">
            ☰
          </button>
        </div>
        
        <div className="navbar-right">
          <div className="navbar-quick-actions">
            <button className="navbar-action-btn" onClick={() => setActiveTab('chat')} title="Live Chat">
              <span className="navbar-action-icon">
                <ChatIcon size={22} color="var(--primary-color)" fill="#ffffff" />
              </span>
              {unreadCount > 0 && <span className="navbar-action-badge">{unreadCount}</span>}
            </button>
            <button className="navbar-action-btn" onClick={() => setActiveTab('ai-assistant')} title="AI Assistant">
              <span className="navbar-action-icon">
                <AIIcon size={22} color="var(--primary-color)" fill="#ffffff" />
              </span>
            </button>
            <button className="navbar-action-btn" onClick={() => setActiveTab('materials')} title="Study Materials">
              <span className="navbar-action-icon">
                {role === 'teacher' ? (
                  <FolderIcon size={22} color="var(--primary-color)" fill="#ffffff" />
                ) : (
                  <MaterialsIcon size={22} color="var(--primary-color)" fill="#ffffff" />
                )}
              </span>
              {unseenMaterials > 0 && <span className="navbar-action-badge">{unseenMaterials}</span>}
            </button>
          </div>
          
          <div className="navbar-profile-container">
            <button className="navbar-profile-trigger" onClick={toggleDropdown}>
              <span className="navbar-profile-icon" style={{ display: 'flex', alignItems: 'center' }}>
                <UserIcon size={20} color="var(--primary-color)" fill="#ffffff" />
              </span>
              <span className="user-name">{userName || 'User'}</span>
              <span className="dropdown-caret">▼</span>
            </button>
            
            {dropdownOpen && (
              <div className="navbar-dropdown-menu">
                <div className="dropdown-user-header">
                  <strong>{userName}</strong>
                  <span className="dropdown-role">{role}</span>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={handleMyProfile}>
                  👤 My Profile
                </button>

                <button className="dropdown-item" onClick={openChangePassword}>
                  🔒 Change Password
                </button>

                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      {changePwdOpen && (
        <div className="change-password-modal-overlay" role="dialog" aria-modal="true">
          <div className="change-password-modal-card">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="modal-close-btn" onClick={closeChangePassword}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleChangePassword}>
              {pwdError && <div className="modal-error-message">{pwdError}</div>}
              {pwdSuccess && <div className="modal-success-message">{pwdSuccess}</div>}
              <div className="modal-form-group">
                <label>Current Password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              </div>
              <div className="modal-form-group">
                <label>New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="modal-form-group">
                <label>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={closeChangePassword}>Cancel</button>
                <button type="submit" className="modal-save-btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
