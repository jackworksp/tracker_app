import React from 'react';
import { Calendar } from 'lucide-react';
import './GoalsPage.css';

const GoalCard = ({ goal }) => {
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

        <div className="goal-target">
          <Calendar size={14} />
          <span>Target: {formatDate(goal.target_date)}</span>
        </div>
      </div>
    </div>
  );
};

export default GoalCard;
