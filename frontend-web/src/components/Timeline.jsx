import React, { useState } from 'react';
import { Calendar, Edit2, Trash2, RotateCcw, Youtube, Play, ExternalLink } from 'lucide-react';
import { message } from 'antd';
import api from '../api';
import './Timeline.css';

export default function Timeline({ sessions, onUpdate, onAddSession }) {
  const [animatingId, setAnimatingId] = useState(null);

  if (!sessions || sessions.length === 0) {
    return (
      <div className="timeline-container">
        <div className="timeline-empty">
          <div className="empty-icon">📚</div>
          <p className="empty-text">No study sessions yet</p>
          <p className="empty-subtext">Complete tasks to add them to history</p>
        </div>
      </div>
    );
  }

  const incrementRevision = async (sessionId) => {
    setAnimatingId(sessionId);
    try {
      // Call API to increment revision
      // await api.sessions.incrementRevision(sessionId);
      message.success('Revision count updated!');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to update revision:', error);
      message.error('Failed to update revision');
    }
    setTimeout(() => setAnimatingId(null), 300);
  };

  const deleteSession = async (sessionId) => {
    try {
      await api.sessions.delete(sessionId);
      message.success('Session deleted');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to delete session:', error);
      message.error('Failed to delete session');
    }
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

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'watch': return '#EF476F';
      case 'read': return '#FF8C42';
      case 'study': return '#06D6A0';
      case 'course': return '#FFD166';
      default: return '#06D6A0';
    }
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
          <h1 className="timeline-title">History</h1>
          <p className="timeline-subtitle">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        {onAddSession && (
          <button className="btn btn-primary btn-sm" onClick={onAddSession}>
            <span>➕</span>
            Add Session
          </button>
        )}
      </div>

      <div className="timeline-list">
        {sortedSessions.map((session) => {
          const { day, month } = formatDate(session.date);
          const duration = session.time_spent || 0; // in minutes
          const youtubeId = getYouTubeId(session.url);
          const topics = session.topics_covered ? session.topics_covered.split(',').map(t => t.trim()).filter(Boolean) : [];
          
          return (
            <div key={session.id} className="session-card">
              <div className="session-content">
                {/* Date Box */}
                <div className="date-box">
                  <div className="date-day">{day}</div>
                  <div className="date-month">{month}</div>
                </div>

                {/* Session Details */}
                <div className="session-details">
                  {/* Duration Badge */}
                  <div className="session-badges">
                    <div 
                      className="duration-badge"
                      style={{
                        backgroundColor: `${getTypeColor(session.type)}20`,
                        color: getTypeColor(session.type),
                        borderColor: `${getTypeColor(session.type)}40`,
                        boxShadow: `0 0 16px ${getTypeColor(session.type)}30`
                      }}
                    >
                      <Calendar size={12} />
                      <span>{formatDuration(duration)}</span>
                    </div>

                    {/* YouTube Badge */}
                    {youtubeId && (
                      <div className="platform-badge youtube-badge">
                        <Youtube size={12} />
                        <span>YouTube</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 
                    className={`session-title ${session.url ? 'has-url' : ''}`}
                    style={session.url ? { color: '#FF8C42', filter: 'drop-shadow(0 0 8px currentColor)' } : {}}
                  >
                    {session.activity}
                  </h3>

                  {/* Thumbnail for YouTube */}
                  {youtubeId && (
                    <a 
                      href={session.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="session-thumbnail"
                    >
                      <img 
                        src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`} 
                        alt={session.activity}
                      />
                      <div className="thumbnail-overlay">
                        <div className="play-button">
                          <Play size={24} />
                        </div>
                      </div>
                      <div className="thumbnail-watermark">
                        <Youtube size={16} />
                      </div>
                    </a>
                  )}

                  {/* Topics */}
                  {topics.length > 0 && (
                    <div className="session-topics">
                      {topics.map((topic, index) => (
                        <span key={index} className="topic-pill">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {session.notes && (
                    <p className="session-notes">{session.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="session-actions">
                    <button
                      onClick={() => incrementRevision(session.id)}
                      className="revision-button"
                    >
                      <RotateCcw size={16} />
                      <span className={animatingId === session.id ? 'animating' : ''}>
                        {session.revision_count || 0}
                      </span>
                    </button>

                    <button className="action-button" title="Edit">
                      <Edit2 size={16} />
                    </button>

                    <button 
                      className="action-button delete-button" 
                      onClick={() => deleteSession(session.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
