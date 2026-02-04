import React, { useState, useEffect } from 'react';
import { X, Check, Pin } from 'lucide-react';
import { message } from 'antd';
import './AddNoteModal.css';

const AddNoteModal = ({ visible, onClose, onSubmit, initialData }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [color, setColor] = useState('#ffffff');

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title || '');
        setContent(initialData.content || '');
        setTags(initialData.tags || []);
        setIsPinned(initialData.is_pinned || false);
        setColor(initialData.color || '#ffffff');
      } else {
        // Reset form
        setTitle('');
        setContent('');
        setTags([]);
        setIsPinned(false);
        setColor('#ffffff');
      }
    }
  }, [visible, initialData]);

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      message.error('Please add a title or content');
      return;
    }

    try {
      await onSubmit({
        id: initialData?.id,
        title,
        content,
        tags,
        is_pinned: isPinned,
        color
      });
      onClose();
    } catch (error) {
      console.error('Error submitting note:', error);
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content note-modal" onClick={e => e.stopPropagation()} style={{ backgroundColor: color }}>
        <form onSubmit={handleSubmit}>
          <div className="note-modal-header">
            <input
              type="text"
              className="note-title-input"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <button 
                type="button" 
                className={`pin-button ${isPinned ? 'pinned' : ''}`}
                onClick={() => setIsPinned(!isPinned)}
            >
                <Pin size={20} fill={isPinned ? "currentColor" : "none"} />
            </button>
          </div>
          
          <div className="note-modal-body">
            <textarea
              className="note-content-input"
              placeholder="Take a note..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
            />
            
            <div className="tags-section">
              <div className="active-tags">
                {tags.map(tag => (
                  <span key={tag} className="tag-chip">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)}><X size={12} /></button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="tag-input"
                placeholder="Add tag (Press Enter)..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
              />
            </div>

            <div className="color-picker-row">
                {['#ffffff', '#f28b82', '#fbbc04', '#fff475', '#ccff90', '#a7ffeb', '#cbf0f8', '#aecbfa', '#d7aefb', '#fdcfe8', '#e6c9a8', '#e8eaed'].map(c => (
                    <button
                        key={c}
                        type="button"
                        className={`color-circle ${color === c ? 'selected' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                    />
                ))}
            </div>
          </div>

          <div className="note-modal-footer">
            <button type="button" className="btn-text" onClick={onClose}>Close</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNoteModal;
