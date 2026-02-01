import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { message } from 'antd';
import GoalCard from './GoalCard';
import AddGoalModal from './AddGoalModal';
import api from '../api';
import './GoalsPage.css';

const GoalsPage = ({ onBack }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await api.goals.getAll();
      setGoals(data);
    } catch (error) {
      console.error('Failed to load goals:', error);
      message.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (goalData) => {
    try {
      await api.goals.create(goalData);
      message.success('Goal added successfully!');
      setAddModalVisible(false);
      loadGoals();
    } catch (error) {
      console.error('Failed to add goal:', error);
      message.error('Failed to add goal');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="goals-page">
        <div className="goals-header">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="goals-title">My Goals</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="goals-page">
      <div className="goals-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="goals-title">My Goals</h1>
      </div>

      <div className="goals-list">
        {goals.length === 0 ? (
          <div className="empty-goals-state">
            <div className="empty-icon">🎯</div>
            <h3>No goals yet</h3>
            <p>Start tracking your personal and professional goals</p>
            <button 
              className="btn btn-primary"
              onClick={() => setAddModalVisible(true)}
            >
              <Plus size={18} />
              Add Your First Goal
            </button>
          </div>
        ) : (
          goals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))
        )}
      </div>

      {goals.length > 0 && (
        <button 
          className="fab-add-goal"
          onClick={() => setAddModalVisible(true)}
          title="Add Goal"
        >
          <Plus size={24} />
        </button>
      )}

      <AddGoalModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleAddGoal}
      />
    </div>
  );
};

export default GoalsPage;
