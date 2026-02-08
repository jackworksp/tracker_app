import React, { useState, useEffect } from 'react';
import {
  Modal,
  Input,
  TextArea,
  Button,
  Select
} from '../design-system';
import { message } from 'antd'; // Keeping message for now, or use a custom toast if available?
// The user didn't mention replacing message, so I'll keep it or look for a design system alternative.
// There is no Toast/Message in the design system list. I'll stick with antd message for logic but remove UI components.
import { useGoals } from '../contexts/GoalsContext';
import { noteLinksApi } from '../api';
import TimeSlider from './TimeSlider';
import AttachmentSelector from './AttachmentSelector';
import './SessionModal.css';

export default function AddSessionModal({ visible, onClose, onSubmit, subjectId, initialValues }) {
  const { goals } = useGoals();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'STUDY',
    activity: '',
    url: '',
    topics: '',
    timeSpent: '',
    notes: '',
    goal_id: ''
  });

  const [errors, setErrors] = useState({});
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        setFormData({
            activity: initialValues.activity,
            type: initialValues.type || 'STUDY',
            url: initialValues.url || '',
            topics: initialValues.topics_covered || '', // Map from existing data if needed
            timeSpent: initialValues.time_spent ? (initialValues.time_spent / 60) : '',
            notes: initialValues.notes || '',
            goal_id: initialValues.goal_id || ''
        });
        setSelectedNote(null);
      } else {
        // Reset form
        setFormData({
          type: 'STUDY',
          activity: '',
          url: '',
          topics: '',
          timeSpent: '',
          notes: '',
          goal_id: ''
        });
        setSelectedNote(null);
      }
      setErrors({});
    }
  }, [visible, initialValues]);

  const validate = () => {
    const newErrors = {};
    if (!formData.activity) newErrors.activity = 'Required';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleWebLinkSelect = (url) => {
    setFormData(prev => ({
      ...prev,
      url: url
    }));
  };

  const handleNoteSelect = (note) => {
    setSelectedNote(note);
    setFormData(prev => ({
      ...prev,
      notes: `Linked to: ${note.title || 'Untitled Note'}`
    }));
  };

  const handleCreateNote = () => {
    // TODO: Open create note modal or navigate to notes page
    message.info('Create note feature coming soon!');
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      const sessionData = {
        subject_id: subjectId,
        date: new Date().toISOString().split('T')[0],
        day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        activity: formData.activity,
        time_spent: formData.timeSpent ? parseFloat(formData.timeSpent) * 60 : 0, // Convert hours to minutes
        topics_covered: formData.topics || '',
        notes: formData.notes || '',
        type: formData.type || 'STUDY',
        url: formData.url || '',
        goal_id: formData.goal_id || undefined
      };

      const createdSession = await onSubmit(sessionData);

      // If a note was selected, link it to the session
      if (selectedNote && createdSession && createdSession.id) {
        try {
          await noteLinksApi.linkToSession(createdSession.id, selectedNote.id);
        } catch (linkError) {
          console.error('Failed to link note to session:', linkError);
          message.warning('Session created but failed to link note');
        }
      }

      message.success('Study session added successfully!');
      onClose();
    } catch (error) {
      console.error('Form validation failed:', error);
      message.error(`Failed to add: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
         Log Session
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', width: '100%' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            Save Session
          </Button>
        </div>
      }
    >
      <div className="session-form-container">
        {/* Type Selection Pills */}
        <div className="type-selector-pills">
          {['STUDY', 'WATCH', 'READ', 'COURSE'].map(t => (
            <div 
              key={t}
              className={`type-pill ${formData.type === t ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: t }))}
            >
              {t === 'STUDY' && '📚 Study'}
              {t === 'WATCH' && '📺 Watch'}
              {t === 'READ' && '📖 Read'}
              {t === 'COURSE' && '🎓 Course'}
            </div>
          ))}
        </div>

        <div className="session-form-inputs">
          <Input 
            name="activity"
            placeholder="What did you work on?" 
            value={formData.activity}
            onChange={handleChange}
            error={errors.activity}
            leftIcon={<span>📝</span>}
            fullWidth
          />

          <Input 
            name="url"
            placeholder="Link (optional)" 
            value={formData.url}
            onChange={handleChange}
            leftIcon={<span>🔗</span>}
            fullWidth
          />

          <Input
            name="topics"
            placeholder="Topics (optional)"
            value={formData.topics}
            onChange={handleChange}
            error={errors.topics}
            leftIcon={<span>🏷️</span>}
            fullWidth
          />

          <TimeSlider
            value={formData.timeSpent}
            onChange={(newValue) => setFormData(prev => ({ ...prev, timeSpent: newValue }))}
            min={0}
            max={12}
            step={0.5}
          />

          <Select
            name="goal_id"
            value={formData.goal_id}
            onChange={handleChange}
            label="Link to Goal (optional)"
            fullWidth
          >
            <option value="">None</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </Select>

          {selectedNote && (
            <div className="selected-note-display">
              <span className="selected-note-label">Linked Note:</span>
              <span className="selected-note-title">{selectedNote.title || 'Untitled Note'}</span>
            </div>
          )}

          <AttachmentSelector
            onSelectWebLink={handleWebLinkSelect}
            onSelectNote={handleNoteSelect}
            onCreateNote={handleCreateNote}
            subjectId={subjectId}
          />
        </div>
      </div>
    </Modal>
  );
}
