import React, { useState, useEffect } from 'react';
import {
  Modal,
  Input,
  TextArea,
  Button,
  Select
} from '../design-system';
import { Target, Hash, Paperclip, Plus, X } from 'lucide-react';
import { useGoals } from '../contexts/GoalsContext';
import './AddTaskModal.css';

const AddTaskModal = ({ isOpen, onClose, onSubmit, prefilledType = 'TASK', initialValues = null }) => {
  const { goals } = useGoals();
  // Map legacy types to new types if needed, or just default to STUDY if unknown
  // Figma types: STUDY, WATCH, READ, COURSE

  const [formData, setFormData] = useState({
    type: 'STUDY',
    title: '',
    url: '',
    topics: '',
    content: '',
    goal_id: '',
    attachment_url: '',
  });

  const [errors, setErrors] = useState({});
  const [showAttachments, setShowAttachments] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Determine initial type
      const validTypes = ['STUDY', 'WATCH', 'READ', 'COURSE'];
      let initialType = 'STUDY';
      
      if (initialValues?.type && validTypes.includes(initialValues.type)) {
        initialType = initialValues.type;
      } else if (prefilledType && validTypes.includes(prefilledType)) {
        initialType = prefilledType;
      } else if (prefilledType === 'TASK' || (initialValues?.type === 'TASK')) {
        initialType = 'STUDY';
      }

      setFormData({
        type: initialType,
        title: initialValues?.title || '',
        url: initialValues?.url || '',
        topics: initialValues?.topics || '',
        content: initialValues?.content || initialValues?.text || '',
        goal_id: initialValues?.goal_id || '',
      });
      setErrors({});
    }
  }, [isOpen, prefilledType, initialValues]);

  const scrapeUrl = async (url) => {
    if (url && (url.includes('instagram.com/reel') || url.includes('instagram.com/p/'))) {
      try {
        // Show loading state implies to user something is happening
        // Could enable a spinner, but for now we just fetch
        const response = await fetch(`${import.meta.env.VITE_API_URL || '/trackapp/api'}/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await response.json();
        if (data && !data.error) {
          setFormData(prev => ({
            ...prev,
            title: data.title || prev.title, // Only override if found
            content: data.description || prev.content,
            type: 'WATCH'
          }));
        }
      } catch (e) {
        console.error('Failed to auto-scrape:', e);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Determine initial type
      const validTypes = ['STUDY', 'WATCH', 'READ', 'COURSE'];
      let initialType = 'STUDY';
      
      if (initialValues?.type && validTypes.includes(initialValues.type)) {
        initialType = initialValues.type;
      } else if (prefilledType && validTypes.includes(prefilledType)) {
        initialType = prefilledType;
      } else if (prefilledType === 'TASK' || (initialValues?.type === 'TASK')) {
        initialType = 'STUDY';
      }

      setFormData({
        type: initialType,
        title: initialValues?.title || '',
        url: initialValues?.url || '',
        topics: initialValues?.topics || '',
        content: initialValues?.content || initialValues?.text || '',
        goal_id: initialValues?.goal_id || '',
      });
      setErrors({});

      // Auto-scrape if opening with a URL (e.g. from Share Intent)
      if (initialValues?.url) {
          scrapeUrl(initialValues.url);
      }
    }
  }, [isOpen, prefilledType, initialValues]);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Required';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    // Prevent default if it's a form event (though Button onClick usually doesn't pass event like form onSubmit)
    if (e && e.preventDefault) e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit({
      type: formData.type,
      title: formData.title,
      url: formData.url || undefined,
      content: formData.content || undefined,
      topics: formData.topics || undefined, // Passing topics even if backend might ignore it for now
      goal_id: formData.goal_id || undefined,
      attachment_url: formData.attachment_url || undefined,
      completed: false,
    });
    
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      className="figma-task-modal"
    >
      <div className="figma-modal-content">
        {/* Header */}
        <div className="figma-modal-header">
          <div className="figma-header-text">
            <h2 className="figma-modal-title">Create New Task</h2>
            <p className="figma-modal-subtitle">Capture your progress</p>
          </div>
          <button className="figma-close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form Container */}
        <div className="figma-form-container">
          {/* Main Title Input with Gradient Underline */}
          <div className="figma-title-container">
            <input
              type="text"
              name="title"
              className="figma-title-input"
              placeholder="What are you working on?"
              value={formData.title}
              onChange={handleChange}
              autoFocus
            />
            <div className="figma-gradient-underline">
              <div className="figma-gradient-bar" style={{ width: formData.title ? '100%' : '40%' }} />
            </div>
          </div>

          {/* Goal Selector Dropdown */}
          <div className="figma-input-wrapper figma-select-wrapper">
            <div className="figma-icon-wrapper">
              <Target size={20} />
            </div>
            <Select
              name="goal_id"
              value={formData.goal_id}
              onChange={(val) => handleChange({ target: { name: 'goal_id', value: val } })}
              placeholder="Select a goal..."
              className="figma-custom-select"
              options={[
                { value: '', label: 'Select a goal...' },
                ...goals.map(g => ({ value: g.id, label: g.title }))
              ]}
            />
          </div>

          {/* Tags Input */}
          <div className="figma-input-wrapper">
            <div className="figma-icon-wrapper">
              <Hash size={20} />
            </div>
            <input
              type="text"
              name="topics"
              className="figma-text-input"
              placeholder="Add tags..."
              value={formData.topics}
              onChange={handleChange}
            />
          </div>

          {/* Attachments Section */}
          <div className="figma-attachments-section">
            <label className="figma-attachments-label">ATTACHMENTS</label>
            <button
              type="button"
              className="figma-attachment-button"
              onClick={() => setShowAttachments(!showAttachments)}
            >
              <Paperclip size={16} />
              <span>Add Attachment</span>
            </button>

            {/* Attachment inputs - shown when button is clicked */}
            {showAttachments && (
              <div className="figma-attachment-inputs">
                <div className="figma-input-wrapper">
                  <input
                    type="url"
                    name="url"
                    className="figma-text-input"
                    placeholder="URL (Instagram, YouTube, etc.)"
                    value={formData.url}
                    onChange={handleChange}
                    onBlur={() => scrapeUrl(formData.url)}
                  />
                </div>
                <div className="figma-input-wrapper">
                  <input
                    type="url"
                    name="attachment_url"
                    className="figma-text-input"
                    placeholder="Attachment URL (Excel, PDF, etc.)"
                    value={formData.attachment_url || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Task Button */}
        <div className="figma-button-container">
          <button
            className="figma-create-button"
            onClick={handleSubmit}
            disabled={!formData.title.trim()}
          >
            <span>Create Task</span>
            <div className="figma-plus-icon">
              <Plus size={16} />
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddTaskModal;
