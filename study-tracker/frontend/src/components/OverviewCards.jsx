import React from 'react';
import './OverviewCards.css';

export default function OverviewCards({ progress, stats, onAddSession }) {
  const topics = progress?.topics || [];
  const revisions = progress?.revisions || [];
  const sessions = progress?.sessions || [];
  
  const completedTopics = topics.filter(t => t.completed).length;
  const totalTopics = topics.length;
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="overview-cards-container">
      {/* Progress Overview Card */}
      <div className="glass-card overview-card fade-in-up">
        <div className="card-header-compact">
          <h3 className="card-title-compact">
            <span className="card-icon">📊</span>
            Progress Overview
          </h3>
          <button className="btn btn-primary btn-sm" onClick={onAddSession}>
            <span>➕</span>
            Add Session
          </button>
        </div>
        
        <div className="progress-overview">
          <div className="progress-item">
            <div className="progress-header">
              <span className="progress-label">Overall Progress</span>
              <span className="progress-percentage">{progressPercent}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Study Summary Card */}
      <div className="glass-card overview-card fade-in-up">
        <div className="card-header-compact">
          <h3 className="card-title-compact">
            <span className="card-icon">💡</span>
            Study Summary
          </h3>
        </div>
        
        <div className="summary-grid">
          <div className="summary-stat">
            <div className="summary-icon">📚</div>
            <div className="summary-value">{totalTopics}</div>
            <div className="summary-label">Total Topics</div>
          </div>
          
          <div className="summary-stat">
            <div className="summary-icon">✅</div>
            <div className="summary-value">{completedTopics}</div>
            <div className="summary-label">Completed</div>
          </div>
          
          <div className="summary-stat">
            <div className="summary-icon">🔄</div>
            <div className="summary-value">{revisions.length}</div>
            <div className="summary-label">Revisions</div>
          </div>
          
          <div className="summary-stat">
            <div className="summary-icon">📅</div>
            <div className="summary-value">{sessions.length}</div>
            <div className="summary-label">Sessions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
