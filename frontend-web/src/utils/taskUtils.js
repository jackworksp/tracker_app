import api from '../api';

/**
 * Auto-creates a study session when a WATCH/READ/TASK is marked complete.
 * @param {Object} task - The task being completed
 * @param {string|null} subjectId - Active subject ID
 * @param {Function} [onSessionCreated] - Optional callback after session is created
 */
export async function logSessionForTask(task, subjectId, onSessionCreated) {
  const duration = task.type === 'TASK' ? 0.25
    : task.type === 'WATCH' ? 1.0
    : task.type === 'READ' ? 0.5
    : 0.25;

  const sessionData = {
    subject_id: subjectId || null,
    type: task.type === 'TASK' ? 'STUDY' : task.type === 'WATCH' ? 'WATCH' : task.type === 'READ' ? 'READ' : 'STUDY',
    activity: task.title,
    url: task.url || null,
    time_spent: Math.round(duration * 60),
    date: new Date().toISOString().split('T')[0],
    day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    topics_covered: task.tags ? task.tags.join(', ') : '',
    notes: task.content || `Completed: ${task.title}`
  };

  return api.sessions.create(sessionData).then(() => {
    if (onSessionCreated) onSessionCreated();
  });
}
