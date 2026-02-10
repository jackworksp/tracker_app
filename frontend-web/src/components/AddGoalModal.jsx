import React, { useState } from 'react';
import { Modal, Input, TextArea, Select, Button } from '../design-system';
import './AddGoalModal.css';

const AddGoalModal = ({ visible, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'CAREER',
    status: 'PLANNING',
    target_date: '',
    image_url: '',
    target_hours: 100
  });
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      if (initialData) {
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          category: initialData.category || 'CAREER',
          status: initialData.status || 'PLANNING',
          target_date: initialData.target_date ? initialData.target_date.split('T')[0] : '',
          image_url: initialData.image_url || '',
          target_hours: initialData.target_hours || 100
        });
      } else {
        setFormData({
          title: '',
          description: '',
          category: 'CAREER',
          status: 'PLANNING',
          target_date: '',
          image_url: '',
          target_hours: 100
        });
      }
    }
  }, [initialData, visible]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit goal:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      title={initialData ? 'Edit Goal' : 'Add New Goal'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="goal-form">
        <Input
          label="Goal Title"
          placeholder="e.g., Run a Marathon"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          fullWidth
        />

        <TextArea
          label="Description"
          placeholder="Describe your goal..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          fullWidth
        />

        <div className="form-row">
          <Select
            label="Category"
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={[
              { value: 'CAREER', label: 'Career' },
              { value: 'HEALTH', label: 'Health' },
              { value: 'FINANCE', label: 'Finance' },
              { value: 'EDUCATION', label: 'Education' },
              { value: 'PERSONAL', label: 'Personal' }
            ]}
            fullWidth
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value })}
            options={[
              { value: 'PLANNING', label: 'Planning' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'ON_HOLD', label: 'On Hold' },
              { value: 'COMPLETED', label: 'Completed' }
            ]}
            fullWidth
          />
        </div>

        <div className="form-row">
          <Input
            label="Target Date"
            type="date"
            value={formData.target_date}
            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
            fullWidth
          />

          <Input
            label="Target Hours"
            type="number"
            min="1"
            placeholder="100"
            value={formData.target_hours}
            onChange={(e) => setFormData({ ...formData, target_hours: e.target.value })}
            fullWidth
          />
        </div>

        <Input
          label="Image URL (optional)"
          type="url"
          placeholder="https://example.com/image.jpg"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          fullWidth
        />

        <div className="modal-actions">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !formData.title.trim()}
            loading={submitting}
          >
            {initialData ? 'Save Changes' : 'Add Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddGoalModal;
