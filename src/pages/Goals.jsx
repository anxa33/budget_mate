import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import SavedGoalsList from '../components/SavedGoalsList';
import GoalOptimizerModal from '../components/GoalOptimizerModal';
import './Goals.css';

const API_BASE = 'http://127.0.0.1:8000';

export default function GoalOptimizer({ onNavigate }) {
  const [savedGoals, setSavedGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [showOptimizer, setShowOptimizer] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setGoalsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/goals`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch goals');

      const data = await response.json();
      setSavedGoals(data);
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setGoalsLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Delete this saved goal?')) return;

    try {
      const response = await fetch(`${API_BASE}/goals/${goalId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.detail || 'Failed to delete goal');
        return;
      }

      setSavedGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  return (
    <div className="goal-container">
      <div className="navbar-top">
        <div className="goal-title">Saving Goals</div>
        <div className="add-goal-btn"><button onClick={() => setShowOptimizer(true)}>Add Goal</button></div> 
        <Navbar onNavigate={onNavigate} />
        
      </div>

     
      <SavedGoalsList
        goals={savedGoals}
        loading={goalsLoading}
        onDelete={handleDeleteGoal}
        
      />

      
      <GoalOptimizerModal
        isOpen={showOptimizer}
        onClose={() => setShowOptimizer(false)}
        token={token}
        onGoalSaved={fetchGoals}
      />
    </div>
  );
}
