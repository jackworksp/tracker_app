import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Target,
  TrendingUp,
  Edit,
  Trash2,
  Plus,
  Clock,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { Modal, Button, H2, H3, Paragraph, Caption } from '../design-system';
import api from '../api';
import './GoalDetailModal.css';

const GoalDetailModal = ({ goal, onClose, onEdit, onDelete, onUpdate }) => {
  const [linkedTasks, setLinkedTasks] = useState([]);
  const [linkedSessions, setLinkedSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (goal) {
      loadGoalDetails();
    }
  }, [goal?.id]);

  const loadGoalDetails = async () => {
    try {
      setLoading(true);

      // Fetch tasks with this goal_id (server-side filtering)
      const tasksResponse = await api.tasks.getAll({ goal_id: goal.id });
      setLinkedTasks(tasksResponse?.data || []);

      // Fetch sessions with this goal_id
      try {
        const sessionsResponse = await api.progress.getSessions({ goal_id: goal.id });
        setLinkedSessions(sessionsResponse?.sessions || []);
      } catch (error) {
        console.error('Failed to load sessions:', error);
        setLinkedSessions([]);
      }
    } catch (error) {
      console.error('Failed to load goal details:', error);
      setLinkedTasks([]);
      setLinkedSessions([]);
    } finally {
      setLoading(false);
    }
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

  const formatStatus = (status) => {
    return status.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysRemaining = (targetDate) => {
    if (!targetDate) return null;
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day remaining';
    return `${diffDays} days remaining`;
  };

  const calculateProgress = () => {
    const timeSpent = (goal.total_minutes || 0) / 60;
    const target = goal.target_hours || 100;
    return Math.min(100, (timeSpent / target) * 100);
  };

  const calculateTaskProgress = () => {
    if (linkedTasks.length === 0) return 0;
    const completedTasks = linkedTasks.filter(t => t.completed || t.status === 'DONE').length;
    return (completedTasks / linkedTasks.length) * 100;
  };

  const getTotalSessionTime = () => {
    return linkedSessions.reduce((total, session) => total + (session.duration || 0), 0);
  };

  if (!goal) return null;

  return (
    <AnimatePresence>
      <Modal
        isOpen={!!goal}
        onClose={onClose}
        title={null}
        size="lg"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="goal-detail-modal"
        >
          {/* Hero Section */}
          <div className="goal-detail-hero">
            {goal.image_url && (
              <div className="goal-detail-image">
                <img src={goal.image_url} alt={goal.title} />
              </div>
            )}
            <div className="goal-detail-header">
              <div className="goal-detail-badges">
                <span
                  className="goal-detail-badge category"
                  style={{
                    backgroundColor: `${getCategoryColor(goal.category)}20`,
                    color: getCategoryColor(goal.category)
                  }}
                >
                  {goal.category}
                </span>
                <span
                  className="goal-detail-badge status"
                  style={{
                    backgroundColor: `${getStatusColor(goal.status)}20`,
                    color: getStatusColor(goal.status)
                  }}
                >
                  {formatStatus(goal.status)}
                </span>
              </div>
              <H2>{goal.title}</H2>
              {goal.description && (
                <Paragraph className="goal-detail-description">
                  {goal.description}
                </Paragraph>
              )}
            </div>
          </div>

          {/* Progress Section */}
          <div className="goal-detail-section">
            <div className="section-header">
              <TrendingUp size={20} />
              <H3>Progress</H3>
            </div>

            {/* Time Progress */}
            <div className="progress-card">
              <div className="progress-info">
                <Caption>Time Spent</Caption>
                <Paragraph>
                  {Math.round((goal.total_minutes || 0) / 60)}h / {goal.target_hours || 100}h
                </Paragraph>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${calculateProgress()}%`,
                    backgroundColor: getCategoryColor(goal.category)
                  }}
                />
              </div>
              <Caption className="progress-percentage">
                {Math.round(calculateProgress())}% complete
              </Caption>
            </div>

            {/* Task Progress */}
            {linkedTasks.length > 0 && (
              <div className="progress-card">
                <div className="progress-info">
                  <Caption>Tasks Completed</Caption>
                  <Paragraph>
                    {linkedTasks.filter(t => t.completed || t.status === 'DONE').length} / {linkedTasks.length}
                  </Paragraph>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${calculateTaskProgress()}%`,
                      backgroundColor: '#06d6a0'
                    }}
                  />
                </div>
                <Caption className="progress-percentage">
                  {Math.round(calculateTaskProgress())}% complete
                </Caption>
              </div>
            )}
          </div>

          {/* Target Date Section */}
          {goal.target_date && (
            <div className="goal-detail-section">
              <div className="section-header">
                <Calendar size={20} />
                <H3>Target Date</H3>
              </div>
              <div className="target-date-card">
                <Paragraph className="target-date">
                  {formatDate(goal.target_date)}
                </Paragraph>
                <Caption className={`days-remaining ${new Date(goal.target_date) < new Date() ? 'overdue' : ''}`}>
                  {getDaysRemaining(goal.target_date)}
                </Caption>
              </div>
            </div>
          )}

          {/* Linked Tasks Section */}
          <div className="goal-detail-section">
            <div className="section-header">
              <CheckSquare size={20} />
              <H3>Linked Tasks</H3>
              <Caption className="count-badge">{linkedTasks.length}</Caption>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <Caption>Loading tasks...</Caption>
              </div>
            ) : linkedTasks.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={32} color="var(--nds-text-tertiary, #868e96)" />
                <Caption>No tasks linked to this goal yet</Caption>
              </div>
            ) : (
              <div className="task-grid">
                {linkedTasks.map(task => (
                  <div key={task.id} className="task-card-mini">
                    <div className="task-card-header">
                      {task.completed || task.status === 'DONE' ? (
                        <CheckSquare size={16} color="#06d6a0" />
                      ) : (
                        <CheckSquare size={16} color="var(--nds-text-tertiary, #868e96)" />
                      )}
                      <Caption className={task.completed || task.status === 'DONE' ? 'completed' : ''}>
                        {task.title}
                      </Caption>
                    </div>
                    {task.deadline && (
                      <Caption className="task-deadline">
                        <Clock size={12} />
                        {formatDate(task.deadline)}
                      </Caption>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Study Sessions Section */}
          <div className="goal-detail-section">
            <div className="section-header">
              <Clock size={20} />
              <H3>Study Sessions</H3>
              <Caption className="count-badge">{linkedSessions.length}</Caption>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <Caption>Loading sessions...</Caption>
              </div>
            ) : linkedSessions.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={32} color="var(--nds-text-tertiary, #868e96)" />
                <Caption>No study sessions logged for this goal yet</Caption>
              </div>
            ) : (
              <div className="sessions-summary">
                <div className="summary-card">
                  <Caption>Total Sessions</Caption>
                  <H3>{linkedSessions.length}</H3>
                </div>
                <div className="summary-card">
                  <Caption>Total Time</Caption>
                  <H3>{Math.round(getTotalSessionTime() / 60)}h</H3>
                </div>
                <div className="summary-card">
                  <Caption>Average Time</Caption>
                  <H3>{linkedSessions.length > 0 ? Math.round(getTotalSessionTime() / linkedSessions.length) : 0}m</H3>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="goal-detail-actions">
            <Button
              variant="outline"
              onClick={() => {
                onEdit(goal);
                onClose();
              }}
              leftIcon={<Edit size={16} />}
            >
              Edit Goal
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (onDelete) {
                  onDelete(goal.id);
                  onClose();
                }
              }}
              leftIcon={<Trash2 size={16} />}
            >
              Delete Goal
            </Button>
          </div>
        </motion.div>
      </Modal>
    </AnimatePresence>
  );
};

export default GoalDetailModal;
