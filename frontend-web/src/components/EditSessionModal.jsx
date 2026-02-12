import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  BookOpen,
  Video,
  FileText,
  GraduationCap
} from 'lucide-react';
import { message } from 'antd';
import NoteAttachmentCard from './NoteAttachmentCard';
import AddNoteModal from './AddNoteModal';
import AddSessionAttachmentModal from './AddSessionAttachmentModal';
import api from '../api';
import { useGoals } from '../contexts/GoalsContext';
import './EditSessionModal.css';

export default function EditSessionModal({ visible, onClose, onSubmit, session }) {
  const { goals } = useGoals();
  const [loading, setLoading] = useState(false);

  // Form fields
  const [activity, setActivity] = useState('');
  const [type, setType] = useState('STUDY');
  const [timeSpent, setTimeSpent] = useState(1);
  const [topicsCovered, setTopicsCovered] = useState('');
  const [notes, setNotes] = useState('');
  const [url, setUrl] = useState('');
  const [date, setDate] = useState('');
  const [goalId, setGoalId] = useState('');

  // Attachment states
  const [linkedNotes, setLinkedNotes] = useState([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);

  // Update form when session changes
  useEffect(() => {
    if (session && visible) {
      setActivity(session.activity || '');
      setType(session.type || 'STUDY');
      setTimeSpent((session.time_spent || 60) / 60); // Convert minutes to hours
      setTopicsCovered(session.topics_covered || '');
      setNotes(session.notes || '');
      setUrl(session.url || '');
      setGoalId(session.goal_id || '');

      // Format date for input
      const sessionDate = new Date(session.date);
      const formattedDate = sessionDate.toISOString().split('T')[0];
      setDate(formattedDate);

      // Load linked notes
      loadLinkedNotes();
    }
  }, [session, visible]);

  const loadLinkedNotes = async () => {
    if (!session?.id) return;
    try {
      const notes = await api.noteLinks.getSessionNotes(session.id);
      setLinkedNotes(notes || []);
    } catch (error) {
      console.error('Failed to load linked notes:', error);
      setLinkedNotes([]);
    }
  };

  const handleSubmit = async () => {
    if (!activity.trim()) {
      message.error('Please enter an activity title');
      return;
    }

    try {
      setLoading(true);

      const sessionData = {
        activity: activity.trim(),
        time_spent: timeSpent * 60, // Convert hours to minutes
        topics_covered: topicsCovered.trim(),
        notes: notes.trim(),
        type,
        url: url.trim(),
        date: date,
        goal_id: goalId || null
      };

      await onSubmit(sessionData);
      onClose();
      message.success('Session updated successfully');
    } catch (error) {
      console.error('Failed to update session:', error);
      message.error('Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const getTypeColor = (sessionType) => {
    const colors = {
      'WATCH': '#FF6467',
      'READ': '#4A90E2',
      'COURSE': '#F5A623',
      'STUDY': '#7B68EE'
    };
    return colors[sessionType] || '#7B68EE';
  };

  const getTypeIcon = (sessionType) => {
    switch (sessionType) {
      case 'WATCH': return <Video size={16} />;
      case 'READ': return <BookOpen size={16} />;
      case 'COURSE': return <GraduationCap size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getYouTubeId = (urlString) => {
    if (!urlString) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = urlString.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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

  const handleAttachmentAdded = async (newUrl) => {
    if (newUrl) {
      setUrl(newUrl);
    }
    await loadLinkedNotes();
  };

  if (!visible) return null;

  const youtubeId = getYouTubeId(url);
  const isInstagram = url?.includes('instagram');
  const hasVisualAttachment = youtubeId || isInstagram;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="edit-session-backdrop"
        onClick={handleCancel}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 20px)' }}
        animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
        exit={{ opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 20px)' }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="edit-session-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="edit-session-handle-bar">
          <div className="edit-session-handle" />
        </div>

        <div className="edit-session-content">
          {/* Header */}
          <div className="edit-session-header">
            <div className="edit-session-type-badge" style={{
              backgroundColor: `${getTypeColor(type)}33`,
              borderColor: `${getTypeColor(type)}66`,
              color: getTypeColor(type)
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {getTypeIcon(type)}
                {type}
              </span>
            </div>

            <button className="edit-session-close-btn" onClick={handleCancel}>
              <X size={20} />
            </button>
          </div>

          {/* Activity Title */}
          <div className="edit-session-section">
            <label className="edit-session-label">Activity / Title *</label>
            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="e.g., Studied Lambda Functions"
              className="edit-session-input"
            />
          </div>

          {/* Date */}
          <div className="edit-session-section">
            <label className="edit-session-label">
              <Calendar size={14} />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="edit-session-input"
            />
          </div>

          {/* Time Spent */}
          <div className="edit-session-section">
            <label className="edit-session-label">
              <Clock size={14} />
              Time Spent (hours)
            </label>
            <input
              type="number"
              value={timeSpent}
              onChange={(e) => setTimeSpent(parseFloat(e.target.value) || 0)}
              min="0.5"
              max="24"
              step="0.5"
              placeholder="2.5"
              className="edit-session-input"
            />
          </div>

          {/* Goal Selection */}
          {goals && goals.length > 0 && (
            <div className="edit-session-section">
              <label className="edit-session-label">🎯 Link to Goal (Optional)</label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="edit-session-select"
              >
                <option value="">No goal</option>
                {goals.map(goal => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Topics */}
          <div className="edit-session-section">
            <label className="edit-session-label">Topics Covered (Optional)</label>
            <input
              type="text"
              value={topicsCovered}
              onChange={(e) => setTopicsCovered(e.target.value)}
              placeholder="e.g., Lambda, API Gateway, DynamoDB"
              className="edit-session-input"
            />
          </div>

          {/* Attachments Section */}
          <div className="edit-session-section">
            <h4 className="edit-session-section-label">
              ATTACHMENTS ({linkedNotes.length + (url ? 1 : 0)})
            </h4>

            {/* Visual Attachments Grid */}
            {(linkedNotes.length > 0 || hasVisualAttachment) && (
              <div className="attachments-grid">
                {/* Linked Notes */}
                {linkedNotes.map(note => (
                  <NoteAttachmentCard
                    key={note.id}
                    note={note}
                    onUnlink={() => handleUnlinkNote(note.id)}
                    onClick={() => handleNoteClick(note)}
                  />
                ))}

                {/* URL Attachment */}
                {youtubeId && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="attachment-visual-card"
                  >
                    <img
                      src={`https://img.youtube.com/vi/${youtubeId}/default.jpg`}
                      alt="YouTube"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div className="attachment-play-overlay">
                      <div className="attachment-play-button" />
                    </div>
                  </a>
                )}

                {isInstagram && !youtubeId && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="attachment-visual-card attachment-instagram"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="18" cy="6" r="1.5" fill="white" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Add Attachment Button */}
            <button
              onClick={() => setIsAttachmentModalOpen(true)}
              className="edit-session-add-btn"
            >
              <Plus size={16} />
              Add Attachment
            </button>
          </div>

          {/* Notes */}
          <div className="edit-session-section">
            <label className="edit-session-label">Notes / Comments</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you learn? Any key takeaways?"
              className="edit-session-textarea"
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="edit-session-actions">
            <button
              onClick={handleCancel}
              className="edit-session-btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="edit-session-btn-primary"
              disabled={loading}
            >
              <CheckCircle size={18} />
              {loading ? 'Updating...' : 'Update Session'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Note Edit Modal */}
      {isNoteModalOpen && (
        <AddNoteModal
          visible={isNoteModalOpen}
          onClose={() => {
            setIsNoteModalOpen(false);
            setEditingNote(null);
          }}
          onSubmit={handleSaveNote}
          editingNote={editingNote}
        />
      )}

      {/* Add Attachment Modal */}
      <AddSessionAttachmentModal
        isOpen={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
        sessionId={session?.id}
        onAttachmentAdded={handleAttachmentAdded}
        existingNoteIds={linkedNotes.map(note => note.id)}
        currentUrl={url}
      />
    </AnimatePresence>
  );
}
