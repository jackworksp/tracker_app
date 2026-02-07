import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api';

const GoalsContext = createContext(null);

export function GoalsProvider({ children, isAuthenticated }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.goals.getAll();
      setGoals(data);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load goals when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadGoals();
    } else {
      setGoals([]);
    }
  }, [isAuthenticated, loadGoals]);

  const addGoal = useCallback(async (goalData) => {
    const newGoal = await api.goals.create(goalData);
    setGoals(prev => [...prev, newGoal]);
    return newGoal;
  }, []);

  const updateGoal = useCallback(async (id, goalData) => {
    const updated = await api.goals.update(id, goalData);
    setGoals(prev => prev.map(g => g.id === id ? updated : g));
    return updated;
  }, []);

  const deleteGoal = useCallback(async (id) => {
    await api.goals.delete(id);
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  return (
    <GoalsContext.Provider value={{ goals, loading, loadGoals, addGoal, updateGoal, deleteGoal }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return ctx;
}
