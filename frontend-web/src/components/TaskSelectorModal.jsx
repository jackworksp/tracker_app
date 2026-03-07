import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Modal, Input, Button } from '@design-system';
import api from '../api';
import './TaskSelectorModal.css';

const TaskSelectorModal = ({ isOpen, onClose, onSelectTask, excludeTaskId, currentSubjectId }) => {
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen, currentSubjectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = currentSubjectId
        ? await api.tasks.getBySubject(currentSubjectId)
        : await api.tasks.getAll();

      const data = response.data || response;
      const filteredTasks = (Array.isArray(data) ? data : [])
        .filter(task => task.id !== excludeTaskId);

      setTasks(filteredTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Parent Task"
      className="task-selector-modal"
      zIndex={2000}
    >
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks..."
          fullWidth
          autoFocus
        />

        <div
          style={{
            marginTop: '1rem',
            maxHeight: '400px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--nds-text-secondary)' }}>
              Loading tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--nds-text-secondary)' }}>
              {searchQuery ? 'No tasks found' : 'No tasks available'}
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                style={{
                  padding: '0.75rem',
                  background: 'var(--nds-bg-secondary)',
                  border: '1px solid var(--nds-surface-border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--nds-bg-tertiary)';
                  e.currentTarget.style.borderColor = 'var(--nds-interactive-focus)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--nds-bg-secondary)';
                  e.currentTarget.style.borderColor = 'var(--nds-surface-border)';
                }}
              >
                <div style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--nds-text-primary)' }}>
                  {task.title}
                </div>
                {task.type && (
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--nds-text-secondary)' }}>
                    {task.type}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
};

export default TaskSelectorModal;
