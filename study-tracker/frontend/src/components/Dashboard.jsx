import React from 'react';
import './Dashboard.css';

export default function Dashboard({ 
  progress, 
  onToggleTopic, 
  onAddRevision, 
  onMarkRevised, 
  onDeleteRevision 
}) {
  const topics = progress?.topics || [];
  const revisions = progress?.revisions || [];
  
  const getRevisionColor = (count) => {
    if (count === 0) return 'rgba(255,255,255,0.1)';
    if (count === 1) return 'rgba(6,214,160,0.2)';
    if (count === 2) return 'rgba(6,214,160,0.4)';
    if (count === 3) return 'rgba(6,214,160,0.6)';
    return 'rgba(6,214,160,0.8)';
  };

  return (
    <div className="dashboard-tab">
      {/* Main Content Area - Topics and Revisions */}
      <div className="dashboard-content-row">
        {/* Topics Checklist */}
        <div className="glass-card content-card fade-in-up">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">📋</span>
              Topics Checklist
            </h3>
          </div>
          
          <div className="topics-grid">
            {topics.length === 0 ? (
              <div className="empty-state">
                <p>No topics yet. Create a subject and add topics to get started!</p>
              </div>
            ) : (
              topics.map(topic => (
                <div 
                  key={topic.id} 
                  className={`topic-item ${topic.completed ? 'completed' : ''}`}
                  onClick={() => onToggleTopic(topic.id, !topic.completed)}
                >
                  <span className="topic-checkbox">
                    {topic.completed ? '✅' : '⬜'}
                  </span>
                  <div className="topic-info">
                    <div className="topic-name">{topic.name}</div>
                    {topic.category && (
                      <div className="topic-category">{topic.category}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Revision Tracker */}
        <div className="glass-card content-card fade-in-up">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">🔄</span>
              Revision Tracker
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={onAddRevision}>
              <span>➕</span>
              Add Item
            </button>
          </div>
          
          <div className="revision-legend">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Revisions:</span>
            {[0, 1, 2, 3, 4].map(count => (
              <span 
                key={count}
                className="revision-badge" 
                style={{ background: getRevisionColor(count) }}
              >
                {count === 4 ? '4+' : count}
              </span>
            ))}
          </div>
          
          <div className="revision-table">
            {revisions.length === 0 ? (
              <div className="empty-state">
                <p>No revision items yet. Click "Add Item" to create one!</p>
              </div>
            ) : (
              revisions.map(item => (
                <div 
                  key={item.id} 
                  className="revision-item"
                  style={{ background: getRevisionColor(item.revision_count) }}
                >
                  <div className="revision-info">
                    <div className="revision-title">{item.title}</div>
                    {item.category && (
                      <div className="revision-category">{item.category}</div>
                    )}
                    <div className="revision-meta">
                      Last: {item.last_revised ? new Date(item.last_revised).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div className="revision-actions">
                    <button 
                      className="btn-icon btn-sm"
                      onClick={() => onMarkRevised(item.id)}
                      title="Mark as revised"
                    >
                      ✓
                    </button>
                    <button 
                      className="btn-icon btn-sm"
                      onClick={() => onDeleteRevision(item.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
