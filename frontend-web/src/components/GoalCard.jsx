import React, { useState, useEffect } from 'react';
import { Calendar, Copy, MoreVertical, PenLine } from 'lucide-react';
import AddJournalEntryModal from './AddJournalEntryModal';
import api from '../api';
import './GoalsPage.css';

const GoalCard = ({ goal, onEdit, onDelete, onClick }) => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(true);

  useEffect(() => {
    if (goal?.id) {
      loadJournalEntries();
    }
  }, [goal?.id]);

  const loadJournalEntries = async () => {
    try {
      setLoadingEntries(true);
      const response = await api.journal.getByGoal(goal.id);
      setJournalEntries(response?.entries || []);
    } catch (error) {
      console.error('Error loading journal entries:', error);
      setJournalEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleJournalSuccess = () => {
    loadJournalEntries();
  };
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

  const handleCopy = (e) => {
    e.stopPropagation();
    // Copy goal details to clipboard
    const goalText = `${goal.title}\n${goal.description}\nTarget: ${formatDate(goal.target_date)}`;
    navigator.clipboard.writeText(goalText);
  };

  const handleAddJournal = (e) => {
    e.stopPropagation();
    setShowJournalModal(true);
  };

  const handleMoreClick = (e) => {
    e.stopPropagation();
    // For now, trigger the detail modal
    onClick && onClick(goal);
  };

  const handleCardClick = (e) => {
    // Don't open detail modal if clicking on journal section
    const target = e.target;
    const journalSection = target.closest('.goal-journal-section');

    if (journalSection) {
      return; // Do nothing if click is within journal section
    }

    onClick && onClick(goal);
  };

  return (
    <div
      className="goal-card"
      onClick={handleCardClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {goal.image_url && (
        <div className="goal-image">
          <img src={goal.image_url} alt={goal.title} />
        </div>
      )}

      <div className="goal-content">
        <div className="goal-header">
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

          <div className="goal-action-buttons">
            <button
              className="goal-icon-btn"
              onClick={handleAddJournal}
              title="Add journal entry"
            >
              <PenLine size={16} />
            </button>
            <button
              className="goal-icon-btn"
              onClick={handleMoreClick}
              title="More options"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        <h3 className="goal-title">{goal.title}</h3>
        <p className="goal-description">{goal.description}</p>

        <div className="goal-target">
          <Calendar size={14} />
          <span>Target: {formatDate(goal.target_date)}</span>
        </div>

        <div
          className="goal-journal-section"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="journal-header">RECENT JOURNAL ENTRIES</div>
          {loadingEntries ? (
            <div className="journal-placeholder">Loading...</div>
          ) : journalEntries.length === 0 ? (
            <div className="journal-placeholder">
              No entries yet. Start journaling!
            </div>
          ) : (
            <div
              className="journal-entries-preview"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              {journalEntries.slice(0, 1).map((entry) => (
                <div
                  key={entry.id}
                  className="journal-entry-preview"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <div className="journal-entry-date">
                    {new Date(entry.entry_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="journal-entry-preview-text">
                    {entry.thoughts?.substring(0, 60)}
                    {entry.thoughts?.length > 60 ? '...' : ''}
                  </div>
                </div>
              ))}
              {journalEntries.length > 1 && (
                <div className="journal-more-count">
                  +{journalEntries.length - 1} more {journalEntries.length - 1 === 1 ? 'entry' : 'entries'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AddJournalEntryModal
        visible={showJournalModal}
        onClose={() => setShowJournalModal(false)}
        goal={goal}
        onSuccess={handleJournalSuccess}
      />
    </div>
  );
};

export default GoalCard;
