import React, { useState } from 'react';
import { X } from 'lucide-react';
import './AddGoalModal.css';

const AddGoalModal = ({ visible, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'CAREER',
    status: 'PLANNING',
    target_date: '',
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || 'CAREER',
        status: initialData.status || 'PLANNING',
        target_date: initialData.target_date ? initialData.target_date.split('T')[0] : '',
        image_url: initialData.image_url || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'CAREER',
        status: 'PLANNING',
        target_date: '',
        image_url: ''
      });
    }
  }, [initialData, visible]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
      // Form reset happens in useEffect when initialData changes or modal closes/opens
    } catch (error) {
      console.error('Failed to submit goal:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-goal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData ? 'Edit Goal' : 'Add New Goal'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="goal-form">
          <div className="form-group">
            <label htmlFor="title">Goal Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Run a Marathon"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your goal..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="CAREER" style={{ backgroundColor: '#181926', color: '#F8F9FA' }}>Career</option>
                <option value="HEALTH" style={{ backgroundColor: '#181926', color: '#F8F9FA' }}>Health</option>
                <option value="FINANCE" style={{ backgroundColor: '#181926', color: '#F8F9FA' }}>Finance</option>
                <option value="EDUCATION" style={{ backgroundColor: '#181926', color: '#F8F9FA' }}>Education</option>
                <option value="PERSONAL" style={{ backgroundColor: '#181926', color: '#F8F9FA' }}>Personal</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="PLANNING" style={{ backgroundColor: '#181926', color: '#F8F9FA' }}>Planning</option>
                <option value="IN_PROGRESS" style={{ backgroundColor: '#181926', color: '#F8F9FA' }}>In Progress</option>
                <option value="ON_HOLD" style={{ backgroundColor: '#181926', color: '#F8F9FA' }}>On Hold</option>
                <option value="COMPLETED" style={{ backgroundColor: '#181926', color: '#F8F9FA' }}>Completed</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="target_date">Target Date</label>
            <input
              type="date"
              id="target_date"
              name="target_date"
              value={formData.target_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="image_url">Image URL (optional)</label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting || !formData.title.trim()}
            >
              {submitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Goal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;
