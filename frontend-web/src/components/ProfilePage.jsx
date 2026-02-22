import React, { useState, useEffect } from 'react';
import {
  User, Mail, Camera, Loader2, LogOut,
  ChevronRight, Award, Flame, Target,
  Bell, Moon, Sun, Shield, Settings, Edit2, BookOpen,
  Key, Copy, RefreshCw
} from 'lucide-react';
import SecuritySettings from './SecuritySettings';
import { useTheme } from '../contexts/ThemeContext';
import api from '../api';
import './ProfilePage.css';

const ProfilePage = ({ user, onLogout, onLogin, onNavigateToGoals, onUpdateUser, onManageSubjects }) => {
  const fileInputRef = React.useRef(null);
  const { isDarkMode, toggleTheme } = useTheme();

  const [mcpKey, setMcpKey] = useState(null); // { has_key, masked_key }
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState(null);
  const [mcpKeyLoading, setMcpKeyLoading] = useState(false);
  const [mcpKeyCopied, setMcpKeyCopied] = useState(false);

  useEffect(() => {
    if (user) {
      api.auth.getMcpKey().then(setMcpKey).catch(() => {});
    }
  }, [user]);

  const handleRegenerateMcpKey = async () => {
    if (mcpKey?.has_key && !window.confirm('This will invalidate your existing MCP API key. Continue?')) return;
    setMcpKeyLoading(true);
    try {
      const res = await api.auth.regenerateMcpKey();
      setNewlyGeneratedKey(res.api_key);
      setMcpKey({ has_key: true, masked_key: `${res.api_key.substring(0, 8)}${'•'.repeat(24)}${res.api_key.substring(res.api_key.length - 4)}` });
    } catch (e) {
      alert('Failed to generate key');
    } finally {
      setMcpKeyLoading(false);
    }
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setMcpKeyCopied(true);
    setTimeout(() => setMcpKeyCopied(false), 2000);
  };

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
    { icon: Bell, label: 'Notifications', value: 'On', onClick: null },
    {
      icon: isDarkMode ? Moon : Sun,
      label: 'Dark Mode',
      value: isDarkMode ? 'On' : 'Off',
      onClick: toggleTheme,
    },
    { icon: Shield, label: 'Privacy & Security', onClick: null },
    { icon: Settings, label: 'App Settings', onClick: null },
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
        <button 
            className="profile-menu-item" 
            onClick={() => {
                // alert('Debug: My Subjects Clicked'); // Visual confirmation
                console.log('🔴 My Subjects clicked in ProfilePage');
                if (onManageSubjects) {
                    onManageSubjects();
                } else {
                    console.error('❌ onManageSubjects prop is missing!');
                    alert('Error: Functionality not connected. Please refresh.');
                }
            }}
        >
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
          <button key={index} className="profile-menu-item" onClick={item.onClick || undefined}>
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

          {/* Security Settings */}
          <section className="mb-8">
            <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4 px-1">
              Security
            </h3>
            <SecuritySettings />
          </section>

          {/* MCP API Key */}
          <section className="mb-8">
            <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4 px-1">
              MCP Integration
            </h3>
            <div className="bg-[#1e1e1e] rounded-xl p-4 border border-white/5 space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Key size={20} />
                </div>
                <div>
                  <h4 className="text-white font-medium">MCP API Key</h4>
                  <p className="text-xs text-gray-400">Use this key to connect Claude AI to your Vela data</p>
                </div>
              </div>

              {mcpKey?.has_key && (
                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg font-mono text-sm text-gray-300">
                  <span className="flex-1 truncate">{mcpKey.masked_key}</span>
                </div>
              )}

              {newlyGeneratedKey && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                  <p className="text-xs text-green-400 font-medium">Copy now — this key won't be shown again</p>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 font-mono text-xs text-green-300 break-all">{newlyGeneratedKey}</span>
                    <button
                      onClick={() => handleCopyKey(newlyGeneratedKey)}
                      className="p-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 flex-shrink-0"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  {mcpKeyCopied && <p className="text-xs text-green-400">Copied!</p>}
                  <p className="text-xs text-gray-400 mt-1">Add to <code className="text-purple-300">mcp-server/.env</code> as <code className="text-purple-300">API_KEY=...</code></p>
                </div>
              )}

              <button
                onClick={handleRegenerateMcpKey}
                disabled={mcpKeyLoading}
                className="w-full flex items-center justify-center gap-2 p-2.5 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <RefreshCw size={15} className={mcpKeyLoading ? 'animate-spin' : ''} />
                {mcpKey?.has_key ? 'Regenerate Key' : 'Generate Key'}
              </button>
            </div>
          </section>

          {/* Account Actions */}
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
