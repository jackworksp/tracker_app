import React from 'react';
import { Dropdown, Avatar, Button } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, TrophyOutlined } from '@ant-design/icons';
import './UserProfile.css';

export default function UserProfile({ user, onLogout, onLogin }) {
  if (!user) {
    return (
      <div className="user-profile-guest">
        <Button 
          type="primary" 
          size="large"
          onClick={onLogin}
          className="login-button"
        >
          Login / Sign Up
        </Button>
      </div>
    );
  }

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <div className="profile-menu-header">
          <div className="profile-menu-name">{user.name}</div>
          <div className="profile-menu-email">{user.email}</div>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'stats',
      icon: <TrophyOutlined />,
      label: 'My Statistics',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: onLogout,
    },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      onLogout();
    }
    // Add handlers for other menu items as needed
  };

  return (
    <div className="user-profile">
      <Dropdown
        menu={{ items: menuItems, onClick: handleMenuClick }}
        placement="bottomRight"
        arrow
        trigger={['click']}
      >
        <div className="profile-trigger">
          <Avatar 
            size={40} 
            icon={<UserOutlined />} 
            style={{ 
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              cursor: 'pointer',
              border: '2px solid var(--glass-border)'
            }}
          />
          <div className="profile-info">
            <div className="profile-name">{user.name}</div>
            <div className="profile-email">{user.email}</div>
          </div>
        </div>
      </Dropdown>
    </div>
  );
}
