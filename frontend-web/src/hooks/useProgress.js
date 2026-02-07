import { useState, useEffect, useCallback, useMemo } from 'react';
import { message } from 'antd';
import api from '../api';

export default function useProgress(currentSubject, user) {
  const [progress, setProgress] = useState(null);
  const [sessionSourceFilter, setSessionSourceFilter] = useState('');
  const [sessionDateRange, setSessionDateRange] = useState({ start: '', end: '' });

  const loadProgress = useCallback(async (subjectId) => {
    try {
      const filters = {};
      if (sessionSourceFilter) filters.source = sessionSourceFilter;
      if (sessionDateRange.start) filters.start_date = sessionDateRange.start;
      if (sessionDateRange.end) filters.end_date = sessionDateRange.end;

      const data = await api.progress.getBySubject(subjectId, filters);
      setProgress(data);
    } catch (error) {
      console.error('Failed to load progress:', error);
      message.error(`Failed to load progress: ${error.message}`);
    }
  }, [sessionSourceFilter, sessionDateRange]);

  // Reload when subject or filters change
  useEffect(() => {
    if (!user) return;
    const subjectId = currentSubject ? currentSubject.id : null;
    loadProgress(subjectId);
  }, [currentSubject, user, loadProgress]);

  const refreshProgress = useCallback(() => {
    const subjectId = currentSubject ? currentSubject.id : null;
    return loadProgress(subjectId);
  }, [currentSubject, loadProgress]);

  const clearFilters = useCallback(() => {
    setSessionSourceFilter('');
    setSessionDateRange({ start: '', end: '' });
  }, []);

  const stats = useMemo(() => {
    if (!progress) {
      return {
        streak: 0,
        totalHours: 0,
        completedTopics: 0,
        studyDays: 0,
        totalTopics: 0,
        totalSessions: 0,
        examReadiness: 0,
      };
    }

    const sessions = progress.sessions || [];
    const topics = progress.topics || [];

    const totalMinutes = sessions.reduce((sum, s) => sum + s.time_spent, 0);
    const totalHours = Math.round(totalMinutes / 60);
    const completedTopics = topics.filter(t => t.completed).length;
    const totalTopics = topics.length;
    const examReadiness = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    const uniqueDays = new Set(sessions.map(s => s.date)).size;

    const sortedDates = [...new Set(sessions.map(s => s.date))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];

    if (sortedDates.length > 0) {
      let currentDate = new Date(today);
      for (const dateStr of sortedDates) {
        const sessionDate = new Date(dateStr);
        const diffDays = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= streak + 1) {
          streak++;
          currentDate = sessionDate;
        } else {
          break;
        }
      }
    }

    return {
      streak,
      totalHours,
      completedTopics,
      studyDays: uniqueDays,
      totalTopics,
      totalSessions: sessions.length,
      examReadiness,
    };
  }, [progress]);

  return {
    progress,
    stats,
    loadProgress,
    refreshProgress,
    sessionSourceFilter,
    setSessionSourceFilter,
    sessionDateRange,
    setSessionDateRange,
    clearFilters,
  };
}
