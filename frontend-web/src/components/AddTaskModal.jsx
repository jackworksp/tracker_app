import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Input, 
  TextArea, 
  Button 
} from '../design-system';
import './AddTaskModal.css';

const AddTaskModal = ({ isOpen, onClose, onSubmit, prefilledType = 'TASK', initialValues = null }) => {
  // Map legacy types to new types if needed, or just default to STUDY if unknown
  // Figma types: STUDY, WATCH, READ, COURSE
  
  const [formData, setFormData] = useState({
    type: 'STUDY', 
    title: '',
    url: '',
    topics: '',
    content: '',
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
      } else if (prefilledType === 'TASK' || (initialValues?.type === 'TASK')) {
        initialType = 'STUDY';
      }

      setFormData({
        type: initialType,
        title: initialValues?.title || '',
        url: initialValues?.url || '',
        topics: initialValues?.topics || '',
        content: initialValues?.content || initialValues?.text || '',
      });
      setErrors({});
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
      completed: false,
    });
    
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Task"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', width: '100%' }}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!formData.title.trim()}>
                Create Task
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
                        {type === 'STUDY' && '📚 Study'}
                        {type === 'WATCH' && '📺 Watch'}
                        {type === 'READ' && '📖 Read'}
                        {type === 'COURSE' && '🎓 Course'}
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
                    label="Task Title"
                    required
                    autoFocus
                    fullWidth
                />

                <Input
                    name="url"
                    placeholder="https://..."
                    value={formData.url}
                    onChange={handleChange}
                    label="URL (optional)"
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

export default AddTaskModal;
