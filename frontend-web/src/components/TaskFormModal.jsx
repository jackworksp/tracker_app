import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Clock, Target, Hash } from 'lucide-react';
import { Modal, Button, Select } from '../design-system';
import TimeSlider from './TimeSlider';
import ActivityTypeSelector from './ActivityTypeSelector';
import AttachmentSelector from './AttachmentSelector';
import './TaskFormModal.css';

const TaskFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  subjects = [],
  initialValues = null
}) => {
  const [formData, setFormData] = useState({
    title: '',
    activityType: 'STUDY',
    duration: 0,
    subjectId: '',
    tags: '',
    attachments: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setFormData({
          title: initialValues.title || '',
          activityType: initialValues.activityType || 'STUDY',
          duration: initialValues.duration || 0,
          subjectId: initialValues.subjectId || '',
          tags: initialValues.tags || '',
          attachments: initialValues.attachments || []
        });
      } else {
        // Reset form
        setFormData({
          title: '',
          activityType: 'STUDY',
          duration: 0,
          subjectId: '',
          tags: '',
          attachments: []
        });
      }
      setErrors({});
      setShowAttachments(false);
    }
  }, [isOpen, initialValues]);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit task:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e) => {
    setFormData(prev => ({ ...prev, title: e.target.value }));
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: null }));
    }
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({ ...prev, activityType: type }));
  };

  const handleDurationChange = (value) => {
    setFormData(prev => ({ ...prev, duration: value }));
  };

  const handleSubjectChange = (value) => {
    setFormData(prev => ({ ...prev, subjectId: value }));
  };

  const handleTagsChange = (e) => {
    setFormData(prev => ({ ...prev, tags: e.target.value }));
  };

  const handleSelectWebLink = () => {
    // TODO: Implement web link input/modal
    console.log('Web link selected');
    const url = prompt('Enter URL:');
    if (url) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, { type: 'link', url }]
      }));
    }
  };

  const handleSelectNote = () => {
    // TODO: Implement note selection modal
    console.log('Note selection requested');
    // This would typically open a modal to select from existing notes
  };

  const handleRemoveAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const subjectOptions = subjects.map(subject => ({
    value: subject.id.toString(),
    label: subject.name
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      showCloseButton={true}
      closeOnOverlayClick={true}
      className="task-form-modal"
    >
      <div className="task-form-container">
        {/* Title Input */}
        <div className="task-form-section task-title-section">
          <input
            type="text"
            className="task-title-input"
            placeholder="What are you working on?"
            value={formData.title}
            onChange={handleTitleChange}
            autoFocus
          />
          <div className="task-title-underline" />
          {errors.title && (
            <span className="task-form-error">{errors.title}</span>
          )}
        </div>

        {/* Activity Type Selector */}
        <div className="task-form-section">
          <ActivityTypeSelector
            selectedType={formData.activityType}
            onTypeChange={handleTypeChange}
          />
        </div>

        {/* Duration Section */}
        <div className="task-form-section task-duration-section">
          <div className="task-section-header">
            <Clock size={18} />
            <span className="task-section-label">DURATION</span>
          </div>
          <div className="task-duration-container">
            <TimeSlider
              value={formData.duration}
              onChange={handleDurationChange}
              min={0}
              max={12}
              step={0.5}
            />
          </div>
        </div>

        {/* Subject Dropdown */}
        <div className="task-form-section task-subject-section">
          <div className="task-subject-wrapper">
            <Target size={18} className="task-subject-icon" />
            <Select
              value={formData.subjectId}
              onChange={handleSubjectChange}
              options={subjectOptions}
              placeholder="Select subject..."
              fullWidth
              size="md"
            />
          </div>
        </div>

        {/* Tags Input */}
        <div className="task-form-section task-tags-section">
          <div className="task-tags-wrapper">
            <Hash size={18} className="task-tags-icon" />
            <input
              type="text"
              className="task-tags-input"
              placeholder="Add tags..."
              value={formData.tags}
              onChange={handleTagsChange}
            />
          </div>
        </div>

        {/* Attachments Section */}
        <div className="task-form-section task-attachments-section">
          <button
            type="button"
            className="task-attachments-toggle"
            onClick={() => setShowAttachments(!showAttachments)}
          >
            <span>Attachments</span>
            <svg
              className={`task-attachments-arrow ${showAttachments ? 'open' : ''}`}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {showAttachments && (
            <div className="task-attachments-content">
              <AttachmentSelector
                onSelectWebLink={handleSelectWebLink}
                onSelectNote={handleSelectNote}
                onClose={() => setShowAttachments(false)}
              />

              {/* Display selected attachments */}
              {formData.attachments.length > 0 && (
                <div className="task-attachments-list">
                  {formData.attachments.map((attachment, index) => (
                    <div key={index} className="task-attachment-item">
                      <span className="task-attachment-label">
                        {attachment.type === 'link' ? `🔗 ${attachment.url}` : `📄 ${attachment.title}`}
                      </span>
                      <button
                        type="button"
                        className="task-attachment-remove"
                        onClick={() => handleRemoveAttachment(index)}
                        aria-label="Remove attachment"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="task-form-actions">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            {initialValues ? 'Update Task' : 'Create Task'}
          </Button>
        </div>

        {errors.submit && (
          <div className="task-form-error-banner">
            {errors.submit}
          </div>
        )}
      </div>
    </Modal>
  );
};

TaskFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  subjects: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string
  })),
  initialValues: PropTypes.shape({
    title: PropTypes.string,
    activityType: PropTypes.string,
    duration: PropTypes.number,
    subjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tags: PropTypes.string,
    attachments: PropTypes.array
  })
};

export default TaskFormModal;
