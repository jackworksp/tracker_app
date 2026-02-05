import React from 'react';
import { User, Mail, LogOut, Settings, Moon, Bell, Shield, ChevronRight, Edit2, Camera, Target, BookOpen } from 'lucide-react';
import './ProfilePage.css';

const ProfilePage = ({ user, onLogout, onLogin, onNavigateToGoals, onUpdateUser }) => {
  const fileInputRef = React.useRef(null);

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

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    try {
        const importApi = await import('../api'); // Dynamic import to avoid circular dep issues just in case, though direct import is fine usually
        // Actually we used 'import api' in App.jsx but not passed it down. 
        // We can just import it at top level if not there, wait.
        // Let me check imports at top of file. 
        // ProfilePage didn't import api. I'll rely on global api import if I add it or proper import.
        // Note: The previous view_file showed no api import in ProfilePage.jsx. I need to add it or pass it.
        // It's better to import it.
    } catch (err) {
        console.error("error", err);
    }
    
    // Actually, let's just use the `api` from standard import which I will add.
  };

    // Need to insert API import at the top first, but I'm in ReplaceFileContent for the body.
    // I will split this into two edits: one for import, one for component logic.
    // Proceeding with component logic assuming access to `api` (I will add import in next step).
    
  const handleUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
          // Assume `api` is imported
          const api = (await import('../api')).default; 
          const response = await api.auth.uploadProfilePhoto(file);
          
          if (response.profile_photo_url) {
              onUpdateUser({
                  ...user,
                  profile_photo_url: response.profile_photo_url
              });
          }
      } catch (error) {
          console.error('Failed to upload photo:', error);
          alert('Failed to upload photo');
      }
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

  // Helper to construct full image URL if needed
  const getProfileImage = () => {
      if (!user.profile_photo_url) return null;
      if (user.profile_photo_url.startsWith('http')) return user.profile_photo_url;
      
      const isCapacitor = window.Capacitor !== undefined;
      const viteUrl = import.meta.env.VITE_API_URL;
      
      if (!viteUrl && !isCapacitor) {
           return user.profile_photo_url;
      }
      
      if (viteUrl) {
           try {
               const urlObj = new URL(viteUrl);
               return `${urlObj.origin}${user.profile_photo_url}`;
           } catch (e) {
               // Fallback
               const cleanBase = viteUrl.replace(/\/api\/?$/, '').replace(/\/trackapp\/?$/, '');
               return `${cleanBase}${user.profile_photo_url}`;
           }
      }
      
      return user.profile_photo_url;
  };

  return (
    <div className="profile-page">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUpload} 
        style={{ display: 'none' }} 
        accept="image/*"
      />
      {/* Profile Header Card */}
      <div className="profile-header-card">
        <div className="profile-header-bg"></div>
        <div className="profile-avatar-wrapper">
          <div 
            className="profile-avatar-large"
            style={{ 
                background: user.profile_photo_url ? 'none' : `linear-gradient(135deg, ${getAvatarColor(user.name)}, ${getAvatarColor(user.email || 'user')})`,
                overflow: 'hidden'
            }}
          >
            {user.profile_photo_url ? (
                <img 
                    src={getProfileImage()} 
                    alt={user.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {e.target.style.display='none'; e.target.parentElement.style.background=`linear-gradient(135deg, ${getAvatarColor(user.name)}, ${getAvatarColor(user.email || 'user')})`; }}
                />
            ) : (
                <span>{getInitials(user.name)}</span>
            )}
          </div>
          <button className="avatar-camera-btn" onClick={handleCameraClick}>
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

      {/* Menu Section */}
      <div className="profile-menu-card">
        <h3 className="menu-section-title">Menu</h3>
        
        {/* My Goals */}
        <button className="profile-menu-item" onClick={onNavigateToGoals}>
          <div className="menu-left">
            <div className="menu-icon-circle" style={{ background: 'rgba(6, 214, 160, 0.15)' }}>
              <Target size={18} style={{ color: '#06d6a0' }} />
            </div>
            <div className="menu-item-text">
              <span>My Goals</span>
              <span className="menu-item-subtitle">3 Active Goals</span>
            </div>
          </div>
          <div className="menu-right">
            <ChevronRight size={18} className="chevron" />
          </div>
        </button>

        {/* My Subjects */}
        <button className="profile-menu-item">
          <div className="menu-left">
            <div className="menu-icon-circle" style={{ background: 'rgba(255, 209, 102, 0.15)' }}>
              <BookOpen size={18} style={{ color: '#ffd166' }} />
            </div>
            <div className="menu-item-text">
              <span>My Subjects</span>
              <span className="menu-item-subtitle">5 Subjects Enrolled</span>
            </div>
          </div>
          <div className="menu-right">
            <ChevronRight size={18} className="chevron" />
          </div>
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
