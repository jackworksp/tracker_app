import React from 'react';
import UserProfile from './UserProfile';
import './Header.css';

export default function Header({ 
  currentSubject, 
  subjects, 
  onSubjectChange, 
  onCreateSubject,
  stats,
  user,
  onLogin,
  onLogout,
  showStats = true
}) {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-title">
            <div className="subject-icon">
              {currentSubject?.icon || '📚'}
            </div>
            <div className="title-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h1>{currentSubject?.name || 'Universal Study Tracker'}</h1>
                <select 
                  className="subject-dropdown" 
                  value={currentSubject?.id || ''}
                  onChange={(e) => onSubjectChange(parseInt(e.target.value) || null)}
                >
                  <option value="">📚 All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.icon} {subject.name}
                    </option>
                  ))}
                </select>
                <button 
                  className="btn-icon" 
                  onClick={onCreateSubject}
                  title="Create New Subject"
                >
                  <span>➕</span>
                </button>
              </div>
              <p className="subtitle">
                {currentSubject?.description || 'Select or create a subject to start tracking'}
              </p>
            </div>
          </div>
          
          <div className="header-right">
            {showStats && (
              <div className="header-stats">
                <div className="stat-badge">
                  <span className="stat-icon">🔥</span>
                  <div>
                    <div className="stat-value">{stats.streak}</div>
                    <div className="stat-label">Day Streak</div>
                  </div>
                </div>
                <div className="stat-badge">
                  <span className="stat-icon">⏱️</span>
                  <div>
                    <div className="stat-value">{stats.totalHours}</div>
                    <div className="stat-label">Total Hours</div>
                  </div>
                </div>
                <div className="stat-badge">
                  <span className="stat-icon">✅</span>
                  <div>
                    <div className="stat-value">{stats.completedTopics}</div>
                    <div className="stat-label">Topics Done</div>
                  </div>
                </div>
              </div>
            )}
            
            <UserProfile 
              user={user} 
              onLogin={onLogin}
              onLogout={onLogout}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
