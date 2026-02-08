import React, { useState, useEffect } from 'react';
import {
  Modal,
  Input,
  TextArea,
  Button
} from '../design-system';
import { BookOpen, Video, BookText, GraduationCap } from 'lucide-react';
import './AddTaskModal.css';

const AddSubtaskModal = ({ isOpen, onClose, onSubmit, prefilledType = 'STUDY', initialValues = null }) => {
  const [formData, setFormData] = useState({
    type: 'STUDY',
    title: '',
    url: '',
    topics: '',
    content: '',
    attachment_url: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Determine initial type
      const validTypes = ['STUDY', 'WATCH', 'READ', 'COURSE'];
      let initialType = 'STUDY';
      
      if (initialValues?.type && validTypes.includes(initialValues.type)) {
        initialType = initialValues.type;
      } else if (prefilledType && validTypes.includes(prefilledType)) {
        initialType = prefilledType;
      }

      setFormData({
        type: initialType,
        title: initialValues?.title || '',
        url: initialValues?.url || '',
        topics: initialValues?.topics || '',
        content: initialValues?.content || '',
        attachment_url: initialValues?.attachment_url || '',
      });
      setErrors({});
    }
  }, [isOpen, prefilledType, initialValues]);

  const scrapeUrl = async (url) => {
    if (url && (url.includes('instagram.com/reel') || url.includes('instagram.com/p/'))) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || '/trackapp/api'}/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await response.json();
        if (data && !data.error) {
          setFormData(prev => ({
            ...prev,
            title: data.title || prev.title,
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
    if (isOpen && initialValues?.url) {
      scrapeUrl(initialValues.url);
    }
  }, [isOpen, initialValues]);

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
    if (e && e.preventDefault) e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit({
      id: Date.now(),
      type: formData.type,
      title: formData.title,
      url: formData.url || undefined,
      content: formData.content || undefined,
      topics: formData.topics || undefined,
      attachment_url: formData.attachment_url || undefined,
      completed: false,
    });
    
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Subtask"
      className="subtask-modal-elevated"
      zIndex={2000}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', width: '100%' }}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!formData.title.trim()}>
                Create Subtask
            </Button>
        </div>
      }
    >
        <div className="task-form-container">
            {/* Type Selector */}
            <div className="type-selector-pills">
                {['STUDY', 'WATCH', 'READ', 'COURSE'].map((type) => (
                    <div
                        key={type}
                        className={`type-pill ${formData.type === type ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, type }))}
                    >
                        {type === 'STUDY' && <><BookOpen size={16} style={{marginRight: '6px'}} /> Study</>}
                        {type === 'WATCH' && <><Video size={16} style={{marginRight: '6px'}} /> Watch</>}
                        {type === 'READ' && <><BookText size={16} style={{marginRight: '6px'}} /> Read</>}
                        {type === 'COURSE' && <><GraduationCap size={16} style={{marginRight: '6px'}} /> Course</>}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Input
                    name="title"
                    placeholder="What needs to be done?"
                    value={formData.title}
                    onChange={handleChange}
                    error={errors.title}
                    label="Subtask Title"
                    required
                    autoFocus
                    fullWidth
                />

                <Input
                    name="url"
                    placeholder="https:// instagram, youtube, etc..."
                    value={formData.url}
                    onChange={handleChange}
                    onBlur={() => scrapeUrl(formData.url)}
                    label="URL (Instagram Reels auto-fill)"
                    fullWidth
                />

                <Input
                    name="attachment_url"
                    placeholder="https://1drv.ms/x/..."
                    value={formData.attachment_url || ''}
                    onChange={handleChange}
                    label="Attachment URL (Excel, PDF, etc.)"
                    fullWidth
                />

                <Input
                    name="topics"
                    placeholder="React, Hooks, TypeScript"
                    value={formData.topics}
                    onChange={handleChange}
                    label="Topics (comma separated)"
                    fullWidth
                />

                <TextArea
                    name="content"
                    placeholder="Additional notes..."
                    value={formData.content}
                    onChange={handleChange}
                    label="Notes (optional)"
                    rows={3}
                    fullWidth
                />
            </div>
        </div>
    </Modal>
  );
};

export default AddSubtaskModal;
