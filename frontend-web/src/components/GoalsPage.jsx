import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { message } from 'antd';
import GoalCard from './GoalCard';
import AddGoalModal from './AddGoalModal';
import { useGoals } from '../contexts/GoalsContext';
import './GoalsPage.css';

const GoalsPage = ({ onBack }) => {
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals();
  const [addModalVisible, setAddModalVisible] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState(null);

  const handleAddGoal = async (goalData) => {
    try {
      if (editingGoal) {
          await updateGoal(editingGoal.id, goalData);
          message.success('Goal updated successfully!');
      } else {
          await addGoal(goalData);
          message.success('Goal added successfully!');
      }
      setAddModalVisible(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Failed to save goal:', error);
      message.error('Failed to save goal');
      throw error;
    }
  };

  const handleEditGoal = (goal) => {
      setEditingGoal(goal);
      setAddModalVisible(true);
  };

  const handleDeleteGoal = async (goalId) => {
      try {
          await deleteGoal(goalId);
          message.success('Goal deleted');
      } catch (error) {
          console.error('Failed to delete goal:', error);
          message.error('Failed to delete goal');
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
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
            />
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
        onClose={() => {
            setAddModalVisible(false);
            setEditingGoal(null);
        }}
        onSubmit={handleAddGoal}
        initialData={editingGoal}
      />
    </div>
  );
};

export default GoalsPage;
