import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, BookOpen, Smile, Meh, Frown, Link as LinkIcon } from 'lucide-react';
import { Modal, Button } from '@design-system';
import api from '../api';
import './AddJournalEntryModal.css';

const MOODS = [
  { value: 'HAPPY', icon: Smile, label: 'Happy', color: '#06d6a0' },
  { value: 'NEUTRAL', icon: Meh, label: 'Neutral', color: '#868e96' },
  { value: 'SAD', icon: Frown, label: 'Sad', color: '#ef476f' }
];

const AddJournalEntryModal = ({ visible, onClose, goal, onSuccess }) => {
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    mood: 'HAPPY',
    thoughts: '',
    link_sessions: true
  });
  const [stats, setStats] = useState({
    study_hours: 0,
    tasks_completed: 0
  });
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (visible && goal) {
      loadWeekStats();
      // Reset form
      setFormData({
        entry_date: new Date().toISOString().split('T')[0],
        mood: 'HAPPY',
        thoughts: '',
        link_sessions: true
      });
    }
  }, [visible, goal]);

  const loadWeekStats = async () => {
    if (!goal) return;

    try {
      setLoadingStats(true);
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Get study sessions for this week
      const sessionsResponse = await api.progress.getSessions({
        goal_id: goal.id,
        start_date: weekStart.toISOString().split('T')[0],
        end_date: weekEnd.toISOString().split('T')[0]
      });

      const sessions = sessionsResponse?.sessions || [];
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || s.time_spent || 0), 0);
      const studyHours = Math.round(totalMinutes / 60 * 10) / 10;

      // Get completed tasks for this goal
      const tasksResponse = await api.tasks.getAll({ goal_id: goal.id });
      const tasks = tasksResponse?.data || [];
      const completedCount = tasks.filter(t => t.completed || t.status === 'DONE').length;

      setStats({
        study_hours: studyHours,
        tasks_completed: completedCount,
        available_sessions: sessions.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({ study_hours: 0, tasks_completed: 0, available_sessions: 0 });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!goal) return;

    try {
      setLoading(true);

      // Get session IDs if linking is enabled
      let session_ids = [];
      if (formData.link_sessions) {
        const today = new Date();
        const sessionsResponse = await api.progress.getSessions({
          goal_id: goal.id,
          start_date: today.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0]
        });
        session_ids = (sessionsResponse?.sessions || []).map(s => s.id);
      }

      await api.journal.create({
        goal_id: goal.id,
        entry_date: formData.entry_date,
        mood: formData.mood,
        thoughts: formData.thoughts,
        link_sessions: formData.link_sessions,
        session_ids
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating journal entry:', error);
      alert('Failed to save journal entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!goal) return null;

  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      title={null}
      size="md"
    >
      <div
        className="journal-entry-modal"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="journal-header">
          <div className="journal-title-section">
            <h2 className="journal-title">Journal Entry</h2>
            <p className="journal-subtitle">
              Reflecting on: <span className="goal-name">{goal.title}</span>
            </p>
          </div>
          <button className="journal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="journal-form">
          {/* Stats Cards */}
          <div className="journal-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {loadingStats ? '...' : `${stats.study_hours}h`}
                </div>
                <div className="stat-label">Studied this week</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <BookOpen size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {loadingStats ? '...' : stats.tasks_completed}
                </div>
                <div className="stat-label">Tasks Completed</div>
              </div>
            </div>
          </div>

          {/* Date and Mood Row */}
          <div className="journal-controls-row">
            <div className="date-picker-wrapper">
              <Calendar size={18} />
              <input
                type="date"
                className="journal-date-input"
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
              />
            </div>

            <div className="mood-selector">
              {MOODS.map((mood) => {
                const MoodIcon = mood.icon;
                return (
                  <button
                    key={mood.value}
                    type="button"
                    className={`mood-btn ${formData.mood === mood.value ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, mood: mood.value })}
                    title={mood.label}
                  >
                    <MoodIcon size={20} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thoughts Text Area */}
          <div className="thoughts-section">
            <label className="thoughts-label">YOUR THOUGHTS</label>
            <textarea
              className="thoughts-textarea"
              placeholder="How are you progressing? What challenges are you facing?"
              value={formData.thoughts}
              onChange={(e) => setFormData({ ...formData, thoughts: e.target.value })}
              rows={6}
            />
            <div className="char-count">{formData.thoughts.length} chars</div>
          </div>

          {/* Link Activity Toggle */}
          <div className="link-activity-section">
            <div className="link-activity-content">
              <LinkIcon size={18} />
              <div className="link-activity-text">
                <div className="link-activity-title">Link Today's Activity</div>
                <div className="link-activity-subtitle">
                  Automatically attach {stats.available_sessions || 0} study session{stats.available_sessions !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <button
              type="button"
              className={`toggle-switch ${formData.link_sessions ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, link_sessions: !formData.link_sessions })}
            >
              <div className="toggle-thumb" />
            </button>
          </div>

          {/* Save Button */}
          <Button
            type="submit"
            variant="primary"
            className="save-entry-btn"
            disabled={loading || !formData.thoughts.trim()}
            loading={loading}
          >
            Save Entry
          </Button>
        </form>
      </div>
    </Modal>
  );
};

export default AddJournalEntryModal;
