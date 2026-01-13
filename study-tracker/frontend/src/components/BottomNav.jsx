import React from 'react';
import { LayoutDashboard, FileText, Calendar, User, Plus, Clipboard } from 'lucide-react';
import './BottomNav.css';

const BottomNav = ({ activeTab, onTabChange, onAddSession }) => {
  const navItems = [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { key: 'tasks', icon: Clipboard, label: 'Tasks' },
    { key: 'add', icon: Plus, label: 'Add', isAction: true },
    { key: 'timesheet', icon: FileText, label: 'Sheet' },
    { key: 'profile', icon: User, label: 'Profile' },
  ];

  const handleClick = (item) => {
    if (item.key === 'add') {
      onAddSession?.();
    } else {
      onTabChange(item.key);
    }
  };

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = !item.isAction && item.key === activeTab;
          
          return (
            <button
              key={item.key}
              className={`bottom-nav-item ${isActive ? 'active' : ''} ${item.isAction ? 'action-btn' : ''}`}
              onClick={() => handleClick(item)}
              aria-label={item.label}
            >
              <div className={`nav-icon-wrapper ${item.isAction ? 'action-icon' : ''}`}>
                <Icon size={item.isAction ? 28 : 22} strokeWidth={item.isAction ? 2.5 : 2} />
              </div>
              {!item.isAction && <span className="nav-label">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
