import React from 'react';
import PropTypes from 'prop-types';
import { Target, Youtube, Book, GraduationCap } from 'lucide-react';
import './ActivityTypeSelector.css';

const activityTypes = [
  {
    id: 'STUDY',
    label: 'Study',
    icon: Target,
    color: 'study'
  },
  {
    id: 'WATCH',
    label: 'Watch',
    icon: Youtube,
    color: 'watch'
  },
  {
    id: 'READ',
    label: 'Read',
    icon: Book,
    color: 'read'
  },
  {
    id: 'COURSE',
    label: 'Course',
    icon: GraduationCap,
    color: 'course'
  }
];

const ActivityTypeSelector = ({ selectedType, onTypeChange }) => {
  return (
    <div className="activity-type-selector">
      {activityTypes.map((type) => {
        const Icon = type.icon;
        const isActive = selectedType === type.id;

        return (
          <button
            key={type.id}
            className={`activity-type-button activity-type-${type.color} ${isActive ? 'active' : ''}`}
            onClick={() => onTypeChange(type.id)}
            type="button"
          >
            <Icon className="activity-type-icon" size={24} />
            <span className="activity-type-label">{type.label}</span>
          </button>
        );
      })}
    </div>
  );
};

ActivityTypeSelector.propTypes = {
  selectedType: PropTypes.string.isRequired,
  onTypeChange: PropTypes.func.isRequired
};

export default ActivityTypeSelector;
