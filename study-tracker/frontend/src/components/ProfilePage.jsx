import React from 'react';
import { User, Mail, LogOut, Settings, Moon, Bell, Shield, ChevronRight, Edit2, Camera } from 'lucide-react';
import './ProfilePage.css';

const ProfilePage = ({ user, onLogout, onLogin }) => {
  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Generate avatar color from name
  const getAvatarColor = (name) => {
    if (!name) return '#6B46C1';
    const colors = ['#06d6a0', '#118ab2', '#ef476f', '#ffd166', '#073b4c', '#6B46C1'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-guest-card">
          <div className="guest-avatar">
            <User size={56} />
          </div>
          <h2>Welcome to TaskTracker!</h2>
          <p>Sign in to sync your study progress across all your devices</p>
          <button className="profile-action-btn primary" onClick={onLogin}>
            <User size={18} />
            Sign In / Sign Up
          </button>
        </div>
        
        <div className="profile-features">
          <h3>Why create an account?</h3>
          <div className="feature-item">
            <div className="feature-icon">☁️</div>
            <div className="feature-text">
              <strong>Cloud Sync</strong>
              <span>Access your data anywhere</span>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <div className="feature-text">
              <strong>Track Progress</strong>
              <span>See your study statistics</span>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🔔</div>
            <div className="feature-text">
              <strong>Reminders</strong>
              <span>Never miss a study session</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: Bell, label: 'Notifications', value: 'On' },
    { icon: Moon, label: 'Dark Mode', value: 'On' },
    { icon: Shield, label: 'Privacy & Security' },
    { icon: Settings, label: 'App Settings' },
  ];

  return (
    <div className="profile-page">
      {/* Profile Header Card */}
      <div className="profile-header-card">
        <div className="profile-header-bg"></div>
        <div className="profile-avatar-wrapper">
          <div 
            className="profile-avatar-large"
            style={{ background: `linear-gradient(135deg, ${getAvatarColor(user.name)}, ${getAvatarColor(user.email || 'user')})` }}
          >
            <span>{getInitials(user.name)}</span>
          </div>
          <button className="avatar-camera-btn">
            <Camera size={16} />
          </button>
        </div>
        <h2 className="profile-username">{user.name || 'User'}</h2>
        <p className="profile-useremail">
          <Mail size={14} />
          {user.email || 'user@example.com'}
        </p>
        <button className="edit-btn">
          <Edit2 size={14} />
          Edit Profile
        </button>
      </div>

      {/* Settings Menu */}
      <div className="profile-menu-card">
        <h3 className="menu-section-title">Settings</h3>
        {menuItems.map((item, index) => (
          <button key={index} className="profile-menu-item">
            <div className="menu-left">
              <div className="menu-icon-circle">
                <item.icon size={18} />
              </div>
              <span>{item.label}</span>
            </div>
            <div className="menu-right">
              {item.value && <span className="menu-value-badge">{item.value}</span>}
              <ChevronRight size={18} className="chevron" />
            </div>
          </button>
        ))}
      </div>

      {/* Logout Section */}
      <div className="profile-logout-section">
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      {/* App Info */}
      <div className="profile-app-info">
        <p className="app-version">TaskTracker v1.0.0</p>
        <p className="app-copyright">Made with ❤️ for learning excellence</p>
      </div>
    </div>
  );
};

export default ProfilePage;
