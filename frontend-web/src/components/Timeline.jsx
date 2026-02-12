import React, { useState, memo } from 'react';
import { Calendar, Edit2, Trash2, RotateCcw, Youtube, Play, ExternalLink, Instagram, Plus, Paperclip } from 'lucide-react';
import './Timeline.css';
import BidirectionalSwipeCard from './BidirectionalSwipeCard';
import { useGoals } from '../contexts/GoalsContext';

export default memo(function Timeline({ sessions, onUpdate, onAddSession, onEdit, onDelete, onRevise, onSessionClick }) {
  const { goals } = useGoals();
  const [animatingId, setAnimatingId] = useState(null);

  if (!sessions || sessions.length === 0) {
    return (
      <div className="timeline-container">
        <div className="timeline-header">
           <div>
             <h1 className="timeline-title">Sessions</h1>
             <p className="timeline-subtitle">Sessions tracking history</p>
           </div>
           <button className="add-session-btn" onClick={onAddSession}>
             <Plus size={24} />
           </button>
        </div>
        <div className="timeline-empty">
          <div className="empty-icon">📚</div>
          <p className="empty-text">No study sessions yet</p>
          <p className="empty-subtext">Complete tasks to add them to history</p>
          <button className="btn-primary mt-4" onClick={onAddSession} style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#6B46C1', color: 'white', cursor: 'pointer' }}>
            Add First Session
          </button>
        </div>
      </div>
    );
  }

  const handleReviseClick = (sessionId) => {
    setAnimatingId(sessionId);
    if (onRevise) {
        onRevise(sessionId);
    }
    setTimeout(() => setAnimatingId(null), 300);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return { day, month };
  };

  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <div>
          <h1 className="timeline-title">Sessions</h1>
          <p className="timeline-subtitle">
            Total {formatDuration(sessions.reduce((acc, s) => acc + (s.time_spent || 0), 0))} • {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
         <button className="add-session-btn" onClick={onAddSession}>
             <Plus size={24} />
         </button>
      </div>

      <div className="timeline-list">
        {sortedSessions.map((session) => {
          const { day, month } = formatDate(session.date);
          const duration = session.time_spent || 0; // in minutes
          const youtubeId = getYouTubeId(session.url);
          const topics = session.topics_covered ? session.topics_covered.split(',').map(t => t.trim()).filter(Boolean) : [];
          const isYouTube = !!youtubeId;
          const isInstagram = session.activity?.toLowerCase().includes('instagram') || session.url?.includes('instagram');

          return (
            <BidirectionalSwipeCard
              key={session.id}
              onSwipeRight={() => onDelete && onDelete(session.id)}
            >
              <div
                className="session-card"
                onClick={() => onSessionClick && onSessionClick(session)}
                style={{ cursor: 'pointer' }}
              >
              <div className="session-content">
                {/* Date Box */}
                <div className="date-box">
                  <div className="date-day">{day}</div>
                  <div className="date-month">{month}</div>
                </div>

                {/* Session Details */}
                <div className="session-details">
                  {/* Badges Row */}
                  <div className="session-badges">
                    <div className="duration-badge">
                      <Calendar />
                      <span>{formatDuration(duration)}</span>
                    </div>

                    {isYouTube && (
                      <div className="platform-badge" style={{ color: '#EF476F', borderColor: 'rgba(239, 71, 111, 0.3)', background: 'rgba(239, 71, 111, 0.1)' }}>
                        <Youtube />
                        <span>YouTube</span>
                      </div>
                    )}

                    {isInstagram && (
                       <div className="platform-badge" style={{ color: '#C13584', borderColor: 'rgba(193, 53, 132, 0.3)', background: 'rgba(193, 53, 132, 0.1)' }}>
                        <ExternalLink size={12} />
                        <span>Instagram</span>
                       </div>
                    )}

                    {session.goal_id && goals.find(g => g.id === session.goal_id) && (
                      <div className="platform-badge" style={{
                        color: '#06D6A0',
                        borderColor: 'rgba(6, 214, 160, 0.3)',
                        background: 'linear-gradient(135deg, rgba(6, 214, 160, 0.15), rgba(17, 138, 178, 0.15))'
                      }}>
                        🎯 <span>{goals.find(g => g.id === session.goal_id)?.title}</span>
                      </div>
                    )}

                    {session.attachment_count > 0 && (
                      <div className="platform-badge" style={{
                        color: '#F5A623',
                        borderColor: 'rgba(245, 166, 35, 0.3)',
                        background: 'rgba(245, 166, 35, 0.1)'
                      }}>
                        <Paperclip size={12} />
                        <span>{session.attachment_count}</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className={`session-title ${session.url ? 'has-url' : ''}`}
                    onClick={(e) => {
                      if (session.url) {
                        e.stopPropagation();
                        window.open(session.url, '_blank');
                      }
                    }}
                  >
                    {session.activity}
                  </h3>

                  {/* Thumbnail - YouTube */}
                  {youtubeId && (
                    <div
                      className="session-thumbnail"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(session.url, '_blank');
                      }}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                        alt={session.activity}
                      />
                      <div className="thumbnail-overlay">
                        <div className="play-button">
                          <Play size={20} fill="currentColor" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Instagram Preview Card */}
                  {!youtubeId && isInstagram && (
                    <div
                      className="instagram-preview-card"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (session.url) window.open(session.url, '_blank');
                      }}
                    >
                      <div className="instagram-gradient-container">
                        <div className="instagram-icon-wrapper">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Topics Pills */}
                  {topics.length > 0 && (
                    <div className="session-topics">
                      {topics.map((topic, index) => (
                        <span key={index} className="topic-pill">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="session-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReviseClick(session.id);
                      }}
                      className="revision-button"
                      title="Revision Count"
                    >
                      <RotateCcw />
                      <span className={animatingId === session.id ? 'animating' : ''}>
                        {session.revision_count || 0}
                      </span>
                    </button>

                    <button
                        className="action-button"
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit && onEdit(session);
                        }}
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      className="action-button delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete && onDelete(session.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </BidirectionalSwipeCard>
          );
        })}
      </div>
    </div>
  );
});

