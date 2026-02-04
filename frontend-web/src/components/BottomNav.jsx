import React from 'react';
import { LayoutDashboard, Calendar, User, Clipboard, StickyNote } from 'lucide-react';
import './BottomNav.css';

const BottomNav = ({ activeTab, onTabChange, onAddSession }) => {
  const navItems = [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { key: 'tasks', icon: Clipboard, label: 'Tasks' },
    { key: 'notes', icon: StickyNote, label: 'Notes' },
    { key: 'timeline', icon: Calendar, label: 'Session' },
    { key: 'profile', icon: User, label: 'Profile' },
  ];

  const handleClick = (item) => {
    onTabChange(item.key);
  };

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === activeTab;
          
          return (
            <button
              key={item.key}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleClick(item)}
              aria-label={item.label}
            >
            <div className="nav-icon-wrapper">
                <Icon size={20} strokeWidth={2} />
              </div>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
