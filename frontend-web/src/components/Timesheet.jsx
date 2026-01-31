import React, { useState } from 'react';
import { Empty, Tooltip, Popconfirm } from 'antd'; // Check if we need Popconfirm or custom
import { Calendar, Clock, Edit2, Trash2, RotateCcw, Youtube, BookOpen, GraduationCap, Instagram } from 'lucide-react';
import './Timesheet.css';
import { motion, AnimatePresence } from 'framer-motion';

export default function Timesheet({ sessions, onEdit, onDelete, onRevise }) {
  const [animatingId, setAnimatingId] = useState(null);

  const handleRevise = (id) => {
    setAnimatingId(id);
    onRevise(id);
    setTimeout(() => setAnimatingId(null), 300);
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <Empty 
          description={<span style={{ color: 'var(--text-secondary)' }}>No study sessions yet. Log your first session!</span>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  // Sort sessions: Date desc, then ID desc
  const sortedSessions = [...sessions].sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff !== 0) return dateDiff;
      return (b.id || 0) - (a.id || 0);
  });

  const getTypeColor = (type) => {
    const t = type?.toUpperCase();
    switch(t) {
        case 'WATCH': return '#EF476F';
        case 'READ': return '#FF8C42';
        case 'STUDY': return '#06D6A0';
        case 'COURSE': return '#FFD166';
        default: return '#ADB5BD';
    }
  };

  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="timesheet-container">
      <div className="sessions-list">
        {sortedSessions.map(session => (
          <div key={session.id} className="session-card glass-card">
            
            {/* Left Column: Date */}
            <div className="session-date-col">
               <div className="date-day">{new Date(session.date).getDate()}</div>
               <div className="date-month font-mono tracking-widest">{new Date(session.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</div>
            </div>

            {/* Middle Column: Info */}
            <div className="session-info-col">
                
                {/* Header Row: Duration & Type Badges */}
                <div className="session-badges-row">
                    <div className="duration-pill">
                        <Clock size={12} />
                        <span>{formatDuration(session.time_spent)}</span>
                    </div>

                    <div 
                        className="type-pill"
                        style={{
                            borderColor: getTypeColor(session.type),
                            color: getTypeColor(session.type),
                            backgroundColor: `${getTypeColor(session.type)}15`
                        }}
                    >
                        {session.type === 'WATCH' && <Youtube size={12} />}
                        {session.type === 'READ' && <BookOpen size={12} />}
                        {session.type === 'COURSE' && <GraduationCap size={12} />}
                        <span>{session.type}</span>
                    </div>
                </div>

                {/* Title (Orange) */}
                <h3 className="session-title">
                    {session.url ? (
                        <a href={session.url} target="_blank" rel="noopener noreferrer" className="session-link">
                            {session.activity}
                        </a>
                    ) : (
                         session.activity
                    )}
                </h3>

                {/* YouTube Preview */}
                {session.url && (session.url.includes('youtube.com') || session.url.includes('youtu.be')) && (
                    <div className="session-thumbnail-container">
                         <div className="thumbnail-overlay" />
                        <img
                            src={`https://img.youtube.com/vi/${(() => {
                                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                                const match = session.url.match(regExp);
                                return (match && match[2].length === 11) ? match[2] : null;
                            })()}/mqdefault.jpg`}
                            alt="Preview"
                            className="session-thumbnail-img"
                        />
                         <div className="thumbnail-icon-badge">
                            <Youtube size={16} />
                         </div>
                    </div>
                )}

                {/* Instagram Preview */}
                {session.url && session.url.includes('instagram.com') && (
                    <div className="instagram-preview-timesheet" onClick={() => window.open(session.url, '_blank')}>
                        <div className="instagram-gradient-bg-timesheet">
                            <div className="instagram-icon-timesheet">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                {/* Topics as Pills */}
                {session.topics_covered && (
                    <div className="session-topics">
                        {session.topics_covered.split(',').map((topic, i) => (
                            <span key={i} className="topic-tag">
                                {topic.trim()}
                            </span>
                        ))}
                    </div>
                )}

                {/* Action Row */}
                <div className="session-actions-row">
                    <button 
                        className="revision-btn"
                        onClick={() => handleRevise(session.id)}
                    >
                         <RotateCcw size={14} className="relative z-10" color="#06D6A0" />
                         <AnimatePresence mode="wait">
                            <motion.span
                                key={session.revision_count || 0}
                                initial={{ y: animatingId === session.id ? -10 : 0, opacity: animatingId === session.id ? 0 : 1 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 10, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="rev-count relative z-10"
                            >
                                {session.revision_count || 0}
                            </motion.span>
                        </AnimatePresence>
                    </button>

                    <div className="action-divider" />

                    <button 
                        className="action-btn-icon" 
                        onClick={() => onEdit?.(session)}
                    >
                        <Edit2 size={16} />
                    </button>
                    
                    <Popconfirm
                        title="Delete session"
                        onConfirm={() => onDelete?.(session.id)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <button className="action-btn-icon delete-btn">
                            <Trash2 size={16} />
                        </button>
                    </Popconfirm>
                </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
