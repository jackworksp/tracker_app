import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, StickyNote, Youtube, Instagram, Paperclip } from 'lucide-react';
import { message } from 'antd';
import NoteSelectorModal from './NoteSelectorModal';
import AttachmentCard from './AttachmentCard';
import api from '../api';
import './AddAttachmentModal.css';

const AddSessionAttachmentModal = ({ isOpen, onClose, sessionId, onAttachmentAdded, existingNoteIds = [], currentUrl = '' }) => {
  const [activeTab, setActiveTab] = useState('url');
  const [url, setUrl] = useState(currentUrl);
  const [title, setTitle] = useState('');
  const [isNoteSelectorOpen, setIsNoteSelectorOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Update URL when currentUrl prop changes
  React.useEffect(() => {
    if (isOpen) {
      setUrl(currentUrl);
    }
  }, [currentUrl, isOpen]);

  // Load attachments when browse tab is active
  useEffect(() => {
    if (activeTab === 'browse' && isOpen) {
      loadAttachments();
    }
  }, [activeTab, isOpen]);

  const loadAttachments = async () => {
    try {
      setLoadingAttachments(true);
      const response = await api.attachments.getAll({}, 1, 50);
      setAttachments(response.attachments || []);
    } catch (error) {
      console.error('Failed to load attachments:', error);
      message.error('Failed to load attachments');
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  // Detect platform from URL
  const detectPlatform = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    return 'link';
  };

  const platform = detectPlatform(url);

  const handleSubmitUrl = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      message.error('Please enter a URL');
      return;
    }

    // Just update the local state in parent component
    // The actual session update will happen when user clicks "Update Session"
    message.success('URL added');
    if (onAttachmentAdded) onAttachmentAdded(url.trim());
    handleClose();
  };

  const handleNoteSelected = async (noteId) => {
    try {
      await api.noteLinks.linkToSession(sessionId, noteId);
      message.success('Note linked to session');
      setIsNoteSelectorOpen(false);
      if (onAttachmentAdded) onAttachmentAdded();
      handleClose();
    } catch (error) {
      console.error('Failed to link note:', error);
      message.error('Failed to link note');
    }
  };

  const handleAttachmentSelect = async (attachment) => {
    try {
      if (attachment.type === 'note') {
        // Link the note to the session
        await api.noteLinks.linkToSession(sessionId, attachment.note_data.id);
        message.success('Note linked to session');
        if (onAttachmentAdded) onAttachmentAdded();
      } else if (attachment.type === 'url' && attachment.url) {
        // Copy the URL to the session
        message.success('URL added');
        if (onAttachmentAdded) onAttachmentAdded(attachment.url);
      }
      handleClose();
    } catch (error) {
      console.error('Failed to add attachment:', error);
      message.error('Failed to add attachment');
    }
  };

  const handleClose = () => {
    setUrl(currentUrl);
    setTitle('');
    setActiveTab('url');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="add-attachment-backdrop"
          onClick={handleClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 20px)' }}
          animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
          exit={{ opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 20px)' }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="add-attachment-container"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="add-attachment-header">
            <h3>Add Attachment</h3>
            <button className="add-attachment-close-btn" onClick={handleClose}>
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="add-attachment-tabs">
            <button
              className={`add-attachment-tab ${activeTab === 'url' ? 'active' : ''}`}
              onClick={() => setActiveTab('url')}
            >
              <LinkIcon size={16} />
              Add URL
            </button>
            <button
              className={`add-attachment-tab ${activeTab === 'note' ? 'active' : ''}`}
              onClick={() => setActiveTab('note')}
            >
              <StickyNote size={16} />
              Link Note
            </button>
            <button
              className={`add-attachment-tab ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              <Paperclip size={16} />
              Browse
            </button>
          </div>

          {/* Content */}
          <div className="add-attachment-content">
            {activeTab === 'url' && (
              <form onSubmit={handleSubmitUrl} className="add-url-form">
                <div className="form-group">
                  <label htmlFor="url">URL</label>
                  <div className="url-input-wrapper">
                    {platform && (
                      <div className="platform-indicator">
                        {platform === 'youtube' && <Youtube size={16} color="#FF0000" />}
                        {platform === 'instagram' && <Instagram size={16} color="#E4405F" />}
                        {platform === 'link' && <LinkIcon size={16} color="#06D6A0" />}
                      </div>
                    )}
                    <input
                      type="url"
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="form-input"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="title">Title (optional)</label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give this attachment a name"
                    className="form-input"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Add Attachment
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'note' && (
              <div className="link-note-content">
                <p className="link-note-description">
                  Link an existing note to this session as an attachment
                </p>
                <button
                  onClick={() => setIsNoteSelectorOpen(true)}
                  className="btn-select-note"
                >
                  <StickyNote size={18} />
                  Select Note
                </button>
              </div>
            )}

            {activeTab === 'browse' && (
              <div className="browse-attachments-content">
                <p className="link-note-description">
                  Select an existing attachment from your collection
                </p>
                {loadingAttachments ? (
                  <div className="attachments-loading">Loading attachments...</div>
                ) : attachments.length === 0 ? (
                  <div className="attachments-empty">
                    No attachments found. Add some URLs or link notes first!
                  </div>
                ) : (
                  <div className="attachments-grid">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        onClick={() => handleAttachmentSelect(attachment)}
                        style={{ cursor: 'pointer' }}
                      >
                        <AttachmentCard
                          attachment={attachment}
                          onDelete={null}
                          onOpenUrl={null}
                          onViewNote={null}
                          onNavigateToSource={null}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Note Selector Modal */}
      <NoteSelectorModal
        isOpen={isNoteSelectorOpen}
        onClose={() => setIsNoteSelectorOpen(false)}
        onSelectNote={handleNoteSelected}
        excludeNoteIds={existingNoteIds}
      />
    </>
  );
};

export default AddSessionAttachmentModal;
