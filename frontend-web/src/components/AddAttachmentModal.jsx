import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, StickyNote, Youtube, Instagram, PenLine } from 'lucide-react';
import { message } from 'antd';
import NoteSelectorModal from './NoteSelectorModal';
import AddNoteModal from './AddNoteModal';
import api from '../api';
import './AddAttachmentModal.css';

const AddAttachmentModal = ({ isOpen, onClose, taskId, onAttachmentAdded, existingNoteIds = [], currentResources = [] }) => {
  const [activeTab, setActiveTab] = useState('url');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isNoteSelectorOpen, setIsNoteSelectorOpen] = useState(false);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

    try {
      setIsLoading(true);

      // Add new resource to the array
      const newResource = {
        id: Date.now(),
        url: url.trim(),
        title: title.trim() || url.trim()
      };

      const updatedResources = [...currentResources, newResource];

      // Update task with new resources array
      await api.tasks.update(taskId, { resources: updatedResources });

      message.success('Attachment added successfully');
      setUrl('');
      setTitle('');
      if (onAttachmentAdded) onAttachmentAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add attachment:', error);
      message.error('Failed to add attachment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoteSelected = () => {
    setIsNoteSelectorOpen(false);
    if (onAttachmentAdded) onAttachmentAdded();
  };

  const handleNewNoteSubmit = async (noteData) => {
    try {
      const newNote = await api.notes.create(noteData);
      await api.noteLinks.linkToTask(taskId, newNote.id);
      message.success('Note created and linked to task');
      setIsNewNoteModalOpen(false);
      if (onAttachmentAdded) onAttachmentAdded();
      onClose();
    } catch (error) {
      console.error('Failed to create note:', error);
      message.error('Failed to create note');
    }
  };

  const handleClose = () => {
    setUrl('');
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
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Adding...' : 'Add Attachment'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'note' && (
              <div className="link-note-content">
                <button
                  onClick={() => setIsNoteSelectorOpen(true)}
                  className="btn-select-note"
                >
                  <StickyNote size={18} />
                  Link Existing Note
                </button>
                <div className="note-option-divider"><span>or</span></div>
                <button
                  onClick={() => setIsNewNoteModalOpen(true)}
                  className="btn-create-note"
                >
                  <PenLine size={18} />
                  Create New Note
                </button>
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
        taskId={taskId}
      />

      {/* Create New Note Modal */}
      <AddNoteModal
        visible={isNewNoteModalOpen}
        onClose={() => setIsNewNoteModalOpen(false)}
        onSubmit={handleNewNoteSubmit}
      />
    </>
  );
};

export default AddAttachmentModal;
