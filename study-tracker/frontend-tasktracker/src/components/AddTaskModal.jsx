import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './AddTaskModal.css';

const AddTaskModal = ({ isOpen, onClose, onSubmit, prefilledType = 'TASK' }) => {
  const [formData, setFormData] = useState({
    type: prefilledType,
    title: '',
    url: '',
    content: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: prefilledType,
        title: '',
        url: '',
        content: '',
      });
    }
  }, [isOpen, prefilledType]);

  const types = ['TASK', 'WATCH', 'READ', 'NOTE'];

  const getTypeColor = (type) => {
    switch (type) {
      case 'WATCH': return '#EF476F';
      case 'READ': return '#FF8C42';
      case 'TASK': return '#06D6A0';
      case 'NOTE': return '#FFD166';
      default: return '#06D6A0';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    onSubmit({
      type: formData.type,
      title: formData.title,
      url: formData.url || undefined,
      content: formData.content || undefined,
      completed: false,
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="glass-modal">
          {/* Top specular highlight */}
          <div className="modal-highlight" />
          
          {/* Header */}
          <div className="modal-header">
            <h2 className="modal-title">Add Task</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="modal-form">
            {/* Type Selector */}
            <div className="form-group">
              <label className="form-label">Type</label>
              <div className="type-selector">
                {types.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type })}
                    className={`type-pill ${formData.type === type ? 'active' : ''}`}
                    style={formData.type === type ? {
                      background: `linear-gradient(135deg, ${getTypeColor(type)}30, ${getTypeColor(type)}20)`,
                      borderColor: `${getTypeColor(type)}80`,
                      color: getTypeColor(type),
                      boxShadow: `0 0 16px ${getTypeColor(type)}30, inset 0 1px 0 rgba(255,255,255,0.1)`
                    } : {}}
                  >
                    {formData.type === type && <div className="pill-gradient" />}
                    <span className="pill-text">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">
                Title <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What do you want to work on?"
                className="form-input"
                required
                autoFocus
              />
            </div>

            {/* URL */}
            <div className="form-group">
              <label className="form-label">URL (optional)</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                className="form-input"
              />
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
                className="form-textarea"
              />
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn-cancel"
              >
                <div className="btn-gradient" />
                <span className="btn-text">Cancel</span>
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={!formData.title.trim()}
              >
                <div className="btn-gradient" />
                <span className="btn-text">Add Task</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
