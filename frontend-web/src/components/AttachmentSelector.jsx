import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, FileText, X, Plus, ArrowLeft } from 'lucide-react';
import { notesApi } from '../api';
import { Input, Button } from '../design-system';
import './AttachmentSelector.css';

const AttachmentSelector = ({
  onSelectWebLink,
  onSelectNote,
  onCreateNote,
  onClose,
  subjectId
}) => {
  const [view, setView] = useState('initial'); // 'initial', 'weblink', 'notes'
  const [linkValue, setLinkValue] = useState('');
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (view === 'notes') {
      fetchRecentNotes();
    }
  }, [view, subjectId]);

  const fetchRecentNotes = async () => {
    try {
      setLoading(true);
      const response = await notesApi.getAll(undefined, subjectId);
      // Sort by creation date and get the 5 most recent
      const sortedNotes = Array.isArray(response)
        ? response.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
        : [];
      setRecentNotes(sortedNotes);
    } catch (error) {
      console.error('Failed to fetch recent notes:', error);
      setRecentNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToInitial = () => {
    setView('initial');
    setLinkValue('');
  };

  const handleWebLinkClick = () => {
    setView('weblink');
  };

  const handleSelectNoteClick = () => {
    setView('notes');
  };

  const handleLinkConfirm = () => {
    if (linkValue.trim() && onSelectWebLink) {
      onSelectWebLink(linkValue);
      handleBackToInitial();
    }
  };

  const handleNoteClick = (note) => {
    if (onSelectNote) {
      onSelectNote(note);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCreateNoteClick = () => {
    if (onCreateNote) {
      onCreateNote();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="attachment-selector">
      <div className="attachment-selector-header">
        <span className="attachment-selector-label">ATTACHMENTS</span>
      </div>

      <div className="attachment-selector-content">
        <div className="attachment-selector-title">
          <span>Select type</span>
          {onClose && (
            <button
              className="attachment-selector-close"
              onClick={onClose}
              type="button"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {view === 'initial' && (
          <div className="attachment-selector-buttons">
            <button
              className="attachment-option-button"
              onClick={handleWebLinkClick}
              type="button"
            >
              <Link className="attachment-option-icon" size={20} />
              <span className="attachment-option-label">Web Link</span>
            </button>

            <button
              className="attachment-option-button"
              onClick={handleSelectNoteClick}
              type="button"
            >
              <FileText className="attachment-option-icon" size={20} />
              <span className="attachment-option-label">Select Note</span>
            </button>
          </div>
        )}

        {view === 'weblink' && (
          <div className="attachment-view-content">
            <button
              className="attachment-back-button"
              onClick={handleBackToInitial}
              type="button"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div className="attachment-input-section">
              <Input
                placeholder="Enter URL..."
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                fullWidth
                autoFocus
              />
              <Button
                variant="primary"
                onClick={handleLinkConfirm}
                disabled={!linkValue.trim()}
                fullWidth
              >
                Confirm
              </Button>
            </div>
          </div>
        )}

        {view === 'notes' && (
          <div className="attachment-view-content">
            <button
              className="attachment-back-button"
              onClick={handleBackToInitial}
              type="button"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div className="recent-notes-section">
              <div className="recent-notes-header">
                <span className="recent-notes-title">RECENT NOTES</span>
                <button
                  className="create-note-btn"
                  onClick={handleCreateNoteClick}
                  type="button"
                  aria-label="Create new note"
                >
                  <Plus size={18} />
                </button>
              </div>

              {loading ? (
                <div className="notes-loading">Loading notes...</div>
              ) : recentNotes.length === 0 ? (
                <div className="notes-empty">
                  <p>No notes found</p>
                  <Button
                    variant="ghost"
                    onClick={handleCreateNoteClick}
                    leftIcon={<Plus size={14} />}
                  >
                    Create your first note
                  </Button>
                </div>
              ) : (
                <div className="recent-notes-list">
                  {recentNotes.map((note) => (
                    <button
                      key={note.id}
                      className="recent-note-item"
                      onClick={() => handleNoteClick(note)}
                      type="button"
                    >
                      <div className="note-item-title">
                        {note.title || 'Untitled Note'}
                      </div>
                      <div className="note-item-preview">
                        {note.content
                          ? `${note.content.substring(0, 60)}${note.content.length > 60 ? '...' : ''}`
                          : 'No content'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

AttachmentSelector.propTypes = {
  onSelectWebLink: PropTypes.func,
  onSelectNote: PropTypes.func,
  onCreateNote: PropTypes.func,
  onClose: PropTypes.func,
  subjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default AttachmentSelector;
