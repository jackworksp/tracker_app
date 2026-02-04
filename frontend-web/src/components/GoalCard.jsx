import React from 'react';
import { Calendar } from 'lucide-react';
import './GoalsPage.css';

const GoalCard = ({ goal, onEdit, onDelete }) => {
  const getCategoryColor = (category) => {
    const colors = {
      CAREER: '#06d6a0',
      HEALTH: '#ef476f',
      FINANCE: '#ffd166',
      EDUCATION: '#118ab2',
      PERSONAL: '#6B46C1'
    };
    return colors[category] || '#06d6a0';
  };

  const getStatusColor = (status) => {
    const colors = {
      IN_PROGRESS: '#06d6a0',
      PLANNING: '#ef476f',
      COMPLETED: '#118ab2',
      ON_HOLD: '#ffd166'
    };
    return colors[status] || '#06d6a0';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className="goal-card">
      {goal.image_url && (
        <div className="goal-image">
          <img src={goal.image_url} alt={goal.title} />
          <div className="goal-actions-overlay">
            <button 
              className="action-btn edit"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit && onEdit(goal);
              }}
            >
              Edit
            </button>
            <button 
              className="action-btn delete"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this goal?')) {
                  onDelete && onDelete(goal.id);
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      
      <div className="goal-content">
        <div className="goal-badges">
          <span 
            className="goal-category-badge"
            style={{ backgroundColor: `${getCategoryColor(goal.category)}20`, color: getCategoryColor(goal.category) }}
          >
            {goal.category}
          </span>
          <span 
            className="goal-status-badge"
            style={{ backgroundColor: `${getStatusColor(goal.status)}20`, color: getStatusColor(goal.status) }}
          >
            {formatStatus(goal.status)}
          </span>
        </div>

        <h3 className="goal-title">{goal.title}</h3>
        <p className="goal-description">{goal.description}</p>

        {/* Start Progress Section */}
        <div className="goal-progress-section" style={{ margin: '12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>
                <span>Progress</span>
                <span>{Math.round((goal.total_minutes || 0) / 60)}h spent</span>
            </div>
            <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div 
                    style={{ 
                        width: `${Math.min(100, Math.max(5, ((goal.total_minutes || 0) / 60) / 100 * 100))}%`, // Mock logic: assume 100h goal for now or just visual
                        height: '100%', 
                        background: getCategoryColor(goal.category),
                        borderRadius: '3px'
                    }} 
                />
            </div>
        </div>
        {/* End Progress Section */}

        <div className="goal-target">
          <Calendar size={14} />
          <span>Target: {formatDate(goal.target_date)}</span>
        </div>
      </div>
    </div>
  );
};

export default GoalCard;
