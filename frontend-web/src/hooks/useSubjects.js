import { useState, useCallback } from 'react';
import { message } from 'antd';
import api from '../api';

export default function useSubjects(user) {
  const [subjects, setSubjects] = useState([]);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.subjects.getAll();
      const data = response.data || response;
      setSubjects(data);

      let homeSubject = data.find(s => s.name === 'Home');
      const savedSubjectId = localStorage.getItem('lastSubjectId');

      // Auto-create Home subject if it doesn't exist
      if (!homeSubject && data.length >= 0) {
        try {
          homeSubject = await api.subjects.create({
            name: 'Home',
            description: 'General dashboard',
            icon: '\uD83C\uDFE0',
            color: '#6B46C1'
          });
          data.push(homeSubject);
          setSubjects([...data]);
        } catch (err) {
          console.error('Failed to auto-create Home subject', err);
        }
      }

      if (savedSubjectId) {
        const savedSubject = data.find(s => s.id.toString() === savedSubjectId);
        if (savedSubject) {
          setCurrentSubject(savedSubject);
        } else if (homeSubject) {
          setCurrentSubject(homeSubject);
          localStorage.setItem('lastSubjectId', homeSubject.id);
        } else if (data.length > 0) {
          setCurrentSubject(data[0]);
          localStorage.setItem('lastSubjectId', data[0].id);
        }
      } else {
        if (homeSubject) {
          setCurrentSubject(homeSubject);
          localStorage.setItem('lastSubjectId', homeSubject.id);
        } else if (data.length > 0) {
          setCurrentSubject(data[0]);
          localStorage.setItem('lastSubjectId', data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
      const errorMessage = `Failed to connect to server: ${err.message}`;
      setError({
        message: errorMessage,
        details: err.toString(),
        canRetry: true
      });
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubjectChange = useCallback((subjectId) => {
    if (!subjectId) {
      setCurrentSubject(null);
      localStorage.removeItem('lastSubjectId');
      return;
    }
    const subject = subjects.find(s => String(s.id) === String(subjectId));
    if (subject) {
      setCurrentSubject(subject);
      localStorage.setItem('lastSubjectId', subject.id);
    }
  }, [subjects]);

  const createSubject = useCallback(async (values) => {
    const newSubject = await api.subjects.create({
      name: values.name,
      description: values.description,
      icon: values.icon,
      color: values.color,
    });

    if (values.seedWithAWS) {
      await api.subjects.seedTopics(newSubject.id);
    }

    await loadSubjects();
    setCurrentSubject(newSubject);
    return newSubject;
  }, [loadSubjects]);

  const deleteSubject = useCallback(async (id) => {
    await api.subjects.delete(id);
    await loadSubjects();
    if (currentSubject?.id === id) {
      setCurrentSubject(null);
      localStorage.removeItem('lastSubjectId');
    }
  }, [currentSubject, loadSubjects]);

  return {
    subjects,
    currentSubject,
    loading,
    error,
    setError,
    loadSubjects,
    handleSubjectChange,
    createSubject,
    deleteSubject,
  };
}
