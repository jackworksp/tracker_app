import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  Trash2,
  Plus,
  Youtube,
  ExternalLink,
  Pencil,
  RotateCcw,
  Play
} from 'lucide-react';
import { message } from 'antd';
import NoteAttachmentCard from './NoteAttachmentCard';
import AddSessionAttachmentModal from './AddSessionAttachmentModal';
import AddNoteModal from './AddNoteModal';
import { useGoals } from '../contexts/GoalsContext';
import api from '../api';
import { resolveUrl } from '../utils/linkUtils';
import './SessionDetailModal.css';

const SessionDetailModal = ({ session, onClose, onDelete, onEdit, onRevise }) => {
  if (!session) return null;

  const { goals } = useGoals();
  const [linkedNotes, setLinkedNotes] = useState([]);
  const [isAddAttachmentModalOpen, setIsAddAttachmentModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Load linked notes
  useEffect(() => {
    if (session && session.id) {
      loadLinkedNotes();
    }
  }, [session.id]);

  const loadLinkedNotes = async () => {
    try {
      const notes = await api.noteLinks.getSessionNotes(session.id);
      setLinkedNotes(notes || []);
    } catch (error) {
      console.error('Failed to load linked notes:', error);
      setLinkedNotes([]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minutes`;
  };

  const getRevisionShade = (count) => {
    // Return progressively more intense purple shades based on revision count
    if (count === 0) return {
      background: 'rgba(139, 92, 246, 0.05)',
      border: '0.667px solid rgba(139, 92, 246, 0.1)',
      color: '#90a1b9'
    };
    if (count <= 2) return {
      background: 'rgba(139, 92, 246, 0.1)',
      border: '0.667px solid rgba(139, 92, 246, 0.2)',
      color: '#a78bfa'
    };
    if (count <= 4) return {
      background: 'rgba(139, 92, 246, 0.2)',
      border: '0.667px solid rgba(139, 92, 246, 0.3)',
      color: '#b69ffa'
    };
    if (count <= 6) return {
      background: 'rgba(139, 92, 246, 0.3)',
      border: '0.667px solid rgba(139, 92, 246, 0.4)',
      color: '#c4b5fd'
    };
    return {
      background: 'rgba(139, 92, 246, 0.4)',
      border: '0.667px solid rgba(139, 92, 246, 0.5)',
      color: '#ddd6fe'
    };
  };

  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  const handleUnlinkNote = async (noteId) => {
    try {
      await api.noteLinks.unlinkFromSession(session.id, noteId);
      await loadLinkedNotes();
      message.success('Note unlinked');
    } catch (error) {
      console.error('Failed to unlink note:', error);
      message.error('Failed to unlink note');
    }
  };

  const handleNoteClick = (note) => {
    setEditingNote(note);
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async (noteData) => {
    try {
      await api.notes.update(noteData.id, noteData);
      message.success('Note updated');
      await loadLinkedNotes();
      setIsNoteModalOpen(false);
      setEditingNote(null);
    } catch (error) {
      console.error('Failed to update note:', error);
      message.error('Failed to update note');
    }
  };

  const handleAttachmentAdded = async () => {
    await loadLinkedNotes();
    setIsAddAttachmentModalOpen(false);
  };

  const handleAddRevision = () => {
    if (onRevise) {
      onRevise(session.id);
      message.success('Revision added');
    }
  };

  const youtubeId = getYouTubeId(session.url);
  const isYouTube = !!youtubeId;
  const isInstagram = session.activity?.toLowerCase().includes('instagram') || session.url?.includes('instagram');
  const topics = session.topics_covered ? session.topics_covered.split(',').map(t => t.trim()).filter(Boolean) : [];
  const linkedGoal = session.goal_id ? goals.find(g => g.id === session.goal_id) : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="session-detail-backdrop"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 20px)' }}
        animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
        exit={{ opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 20px)' }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="session-detail-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="session-detail-handle-bar">
          <div className="session-detail-handle" />
        </div>

        <div className="session-detail-content">
          {/* Header */}
          <div className="session-detail-header">
            <div className="session-detail-type-badge">
              📚 SESSION
            </div>

            <button className="session-detail-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Title & Metadata */}
          <div className="session-detail-title-section">
            <h1 className="session-detail-title">{session.activity}</h1>

            <div className="session-detail-metadata">
              <div className="session-detail-meta-item">
                <Calendar size={16} />
                <span>{formatDate(session.date)}</span>
              </div>
              <div className="session-detail-meta-item">
                <Clock size={16} />
                <span>{formatDuration(session.time_spent || 0)}</span>
              </div>
              <div
                className="session-detail-meta-item"
                style={getRevisionShade(session.revision_count || 0)}
              >
                <RotateCcw size={16} />
                <span>{session.revision_count || 0} revision{session.revision_count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Platform Badges */}
          {(isYouTube || isInstagram || linkedGoal) && (
            <div className="session-detail-section">
              <div className="session-detail-badges">
                {isYouTube && (
                  <div className="session-platform-badge youtube">
                    <Youtube size={14} />
                    <span>YouTube</span>
                  </div>
                )}
                {isInstagram && (
                  <div className="session-platform-badge instagram">
                    <ExternalLink size={14} />
                    <span>Instagram</span>
                  </div>
                )}
                {linkedGoal && (
                  <div className="session-platform-badge goal">
                    🎯 <span>{linkedGoal.title}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* URL Preview */}
          {session.url && (
            <div className="session-detail-section">
              <h4 className="session-detail-section-label">LINK</h4>

              {youtubeId ? (
                <div className="session-youtube-preview" onClick={() => window.open(resolveUrl(session.url), '_blank', 'noopener,noreferrer')}>
                  <img
                    src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                    alt={session.activity}
                  />
                  <div className="session-youtube-overlay">
                    <div className="session-play-button">
                      <Play size={24} fill="currentColor" />
                    </div>
                  </div>
                </div>
              ) : isInstagram ? (
                <div className="session-instagram-preview" onClick={() => window.open(resolveUrl(session.url), '_blank', 'noopener,noreferrer')}>
                  <div className="session-instagram-gradient">
                    <div className="session-instagram-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <a
                  href={session.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="session-link-preview"
                >
                  <ExternalLink size={16} />
                  <span>{session.url}</span>
                </a>
              )}
            </div>
          )}

          {/* Topics */}
          {topics.length > 0 && (
            <div className="session-detail-section">
              <h4 className="session-detail-section-label">TOPICS COVERED</h4>
              <div className="session-topics-grid">
                {topics.map((topic, index) => (
                  <span key={index} className="session-topic-pill">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attachments (Linked Notes) */}
          <div className="session-detail-section">
            <h4 className="session-detail-section-label">
              ATTACHMENTS ({linkedNotes.length})
            </h4>

            {linkedNotes.length > 0 && (
              <div className="session-attachments-grid">
                {linkedNotes.map(note => (
                  <NoteAttachmentCard
                    key={note.id}
                    note={note}
                    onUnlink={() => handleUnlinkNote(note.id)}
                    onClick={() => handleNoteClick(note)}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => setIsAddAttachmentModalOpen(true)}
              className="session-add-attachment-btn"
            >
              <Plus size={16} /> Add Attachment
            </button>
          </div>

          {/* Action Buttons */}
          <div className="session-detail-actions">
            <button
              className="session-detail-btn session-detail-btn-primary"
              onClick={() => {
                handleAddRevision();
              }}
            >
              <RotateCcw size={20} />
              <span>Add Revision</span>
            </button>

            <button
              className="session-detail-btn session-detail-btn-secondary"
              onClick={() => {
                if (onEdit) {
                  onEdit(session);
                  onClose();
                }
              }}
            >
              <Pencil size={20} />
              <span>Edit Session</span>
            </button>
          </div>

          {/* Delete Button */}
          <div className="session-detail-delete-section">
            <button
              className="session-detail-delete-btn"
              onClick={() => {
                if (onDelete) {
                  onDelete(session.id);
                  onClose();
                }
              }}
            >
              <Trash2 size={14} />
              <span>Delete Session</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Add Attachment Modal */}
      <AddSessionAttachmentModal
        isOpen={isAddAttachmentModalOpen}
        onClose={() => setIsAddAttachmentModalOpen(false)}
        sessionId={session.id}
        onAttachmentAdded={handleAttachmentAdded}
        existingNoteIds={linkedNotes.map(note => note.id)}
      />

      {/* Note Edit Modal */}
      <AddNoteModal
        visible={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSubmit={handleSaveNote}
        initialData={editingNote}
      />
    </AnimatePresence>
  );
};

export default SessionDetailModal;
