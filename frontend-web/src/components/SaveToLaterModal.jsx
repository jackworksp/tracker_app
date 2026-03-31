import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Youtube, BookOpen } from 'lucide-react';
import { message } from 'antd';
import api from '../api';
import './AddAttachmentModal.css';

function detectType(url) {
  if (!url) return null;
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'WATCH';
  return 'READ';
}

const SaveToLaterModal = ({ isOpen, onClose, onSaved, subjectId }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('WATCH');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-detect type when URL changes
  useEffect(() => {
    const detected = detectType(url);
    if (detected) setType(detected);
  }, [url]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) { message.error('Please enter a URL'); return; }

    try {
      setIsLoading(true);
      await api.tasks.create({
        title: title.trim() || url.trim(),
        type,
        url: url.trim(),
        subject_id: subjectId || null,
        status: 'TODO',
      });
      message.success('Saved to Later');
      setUrl('');
      setTitle('');
      setType('WATCH');
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save to later:', err);
      message.error('Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setTitle('');
    setType('WATCH');
    onClose();
  };

  if (!isOpen) return null;

  const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');

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
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="add-attachment-container"
        onClick={e => e.stopPropagation()}
      >
        <div className="add-attachment-header">
          <h3>Save for Later</h3>
          <button className="add-attachment-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="add-attachment-content">
          <form onSubmit={handleSubmit} className="add-url-form">
            <div className="form-group">
              <label htmlFor="later-url">URL *</label>
              <div className="url-input-wrapper">
                <div className="platform-indicator">
                  {isYoutube
                    ? <Youtube size={16} color="#FF0000" />
                    : <LinkIcon size={16} color="#06D6A0" />}
                </div>
                <input
                  type="url"
                  id="later-url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="form-input"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="later-title">Title (optional)</label>
              <input
                type="text"
                id="later-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Leave blank to use URL"
                className="form-input"
              />
            </div>

            {/* Type toggle */}
            <div className="form-group">
              <label>Type</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setType('WATCH')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${type === 'WATCH' ? '#ff6b6b' : 'rgba(255,255,255,0.1)'}`,
                    background: type === 'WATCH' ? 'rgba(255,107,107,0.12)' : 'transparent',
                    color: type === 'WATCH' ? '#ff6b6b' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <Youtube size={14} /> Watch
                </button>
                <button
                  type="button"
                  onClick={() => setType('READ')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${type === 'READ' ? '#63b3ed' : 'rgba(255,255,255,0.1)'}`,
                    background: type === 'READ' ? 'rgba(99,179,237,0.12)' : 'transparent',
                    color: type === 'READ' ? '#63b3ed' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <BookOpen size={14} /> Read
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="add-attachment-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save for Later'}
            </button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SaveToLaterModal;
