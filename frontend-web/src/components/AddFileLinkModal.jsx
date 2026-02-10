import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Youtube, Instagram, FileText } from 'lucide-react';
import { message } from 'antd';
import api from '../api';
import './AddAttachmentModal.css'; // Reusing existing styles

const AddFileLinkModal = ({ isOpen, onClose, onLinkAdded, subjectId }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Detect platform from URL
  const detectPlatform = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    return 'link';
  };

  const platform = detectPlatform(url);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      message.error('Please enter a URL');
      return;
    }

    try {
      setIsLoading(true);

      // Create a standalone attachment (not a task)
      const attachmentData = {
        title: title.trim() || url.trim(), // Use URL as title if empty
        url: url.trim(),
        subject_id: subjectId || null, // Optional subject
        platform: detectPlatform(url) // Auto-detect platform
      };

      await api.attachments.create(attachmentData);

      message.success('Link added successfully');
      setUrl('');
      setTitle('');
      if (onLinkAdded) onLinkAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add link:', error);
      message.error('Failed to add link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setTitle('');
    onClose();
  };

  if (!isOpen) return null;

  return (
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
          <h3>Add Link / File</h3>
          <button className="add-attachment-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="add-attachment-content">
            <form onSubmit={handleSubmit} className="add-url-form">
            <div className="form-group">
                <label htmlFor="url">URL *</label>
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
                    placeholder="https://drive.google.com/..."
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
                placeholder="Name this file or link"
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
                {isLoading ? 'Adding...' : 'Add Link'}
                </button>
            </div>
            </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddFileLinkModal;
