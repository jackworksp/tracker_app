import React from 'react';
import { ArrowLeft, Plus, Target } from 'lucide-react';
import { toast } from '../utils/toast';
import GoalCard from './GoalCard';
import AddGoalModal from './AddGoalModal';
import GoalDetailModal from './GoalDetailModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { useGoals } from '../contexts/GoalsContext';
import './GoalsPage.css';

const GoalsPage = ({ onBack }) => {
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals();
  const [addModalVisible, setAddModalVisible] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState(null);
  const [detailModalGoal, setDetailModalGoal] = React.useState(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = React.useState(false);
  const [goalToDelete, setGoalToDelete] = React.useState(null);

  const handleAddGoal = async (goalData) => {
    try {
      if (editingGoal) {
          await updateGoal(editingGoal.id, goalData);
          toast.success('Goal updated successfully!');
      } else {
          await addGoal(goalData);
          toast.success('Goal added successfully!');
      }
      setAddModalVisible(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Failed to save goal:', error);
      toast.error('Failed to save goal');
      throw error;
    }
  };

  const handleEditGoal = (goal) => {
      setEditingGoal(goal);
      setAddModalVisible(true);
  };

  const handleDeleteGoal = (goalId) => {
      const goal = goals.find(g => g.id === goalId);
      setGoalToDelete(goal);
      setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
      try {
          await deleteGoal(goalToDelete.id);
          toast.success('Goal deleted');
          setDeleteConfirmVisible(false);
          setGoalToDelete(null);
          setDetailModalGoal(null); // Close detail modal if open
      } catch (error) {
          console.error('Failed to delete goal:', error);
          toast.error('Failed to delete goal');
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
            <div className="empty-icon"><Target size={48} /></div>
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
              onClick={(goal) => setDetailModalGoal(goal)}
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

      <GoalDetailModal
        goal={detailModalGoal}
        onClose={() => setDetailModalGoal(null)}
        onEdit={(goal) => {
          setEditingGoal(goal);
          setAddModalVisible(true);
          setDetailModalGoal(null);
        }}
        onDelete={handleDeleteGoal}
        onUpdate={updateGoal}
      />

      <DeleteConfirmModal
        visible={deleteConfirmVisible}
        title="Delete Goal?"
        message="Are you sure you want to delete this goal? This will remove the goal link from all associated tasks and sessions."
        itemName={goalToDelete?.title}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setGoalToDelete(null);
        }}
      />
    </div>
  );
};

export default GoalsPage;
