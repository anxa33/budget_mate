import React, { useState } from 'react';

const GoalOptimizerResult = ({ optimizerData, token, onGoalSaved }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Calculate completion percentage: (current_savings / target_amount) * 100
  const rawPercentage = (optimizerData.current_savings / optimizerData.target_amount) * 100;
  const progressPercentage = Math.min(Math.max(rawPercentage, 0), 100).toFixed(1);

  // Dynamic progress bar color based on progress percentage
  const getBarColor = (percent) => {
    if (percent >= 100) return '#22c55e'; // Green (Completed)
    if (percent >= 50) return '#3b82f6';  // Blue (In Progress)
    return '#f59e0b';                    // Amber (Early Stage)
  };

  // Handler to call the /save-goal endpoint
  const handleSaveGoal = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/save-goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          goal_name: optimizerData.goal_name,
          target_amount: optimizerData.target_amount,
          current_savings: optimizerData.current_savings,
          target_date: optimizerData.target_date // Maps to 'deadline' in PostgreSQL
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSavedSuccess(true);
        if (onGoalSaved) onGoalSaved(result.goal);
      } else {
        alert(result.detail || 'Failed to save goal');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '24px',
      backgroundColor: '#ffffff',
      maxWidth: '480px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header & Feasibility Tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#111827', fontSize: '1.25rem' }}>{optimizerData.goal_name}</h3>
        <span style={{
          padding: '4px 10px',
          borderRadius: '16px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          backgroundColor: optimizerData.feasibility === 'Achievable' ? '#dcfce7' : '#fef3c7',
          color: optimizerData.feasibility === 'Achievable' ? '#15803d' : '#b45309'
        }}>
          {optimizerData.feasibility}
        </span>
      </div>

      <p style={{ color: '#4b5563', fontSize: '0.9rem', margin: '10px 0 16px 0' }}>
        {optimizerData.message}
      </p>

      {/* Financial Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ backgroundColor: '#f9fafb', padding: '10px', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Current Savings</span>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#111827' }}>
            Rs.{optimizerData.current_savings.toLocaleString()}
          </p>
        </div>
        <div style={{ backgroundColor: '#f9fafb', padding: '10px', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Target Amount</span>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#111827' }}>
            Rs.{optimizerData.target_amount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div style={{ margin: '16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
          <span style={{ fontWeight: 'bold', color: '#374151' }}>Savings Progress</span>
          <span style={{ fontWeight: 'bold', color: '#111827' }}>{progressPercentage}%</span>
        </div>

        {/* Progress Bar Track */}
        <div style={{
          height: '12px',
          width: '100%',
          backgroundColor: '#e5e7eb',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          {/* Filled Progress Segment */}
          <div style={{
            height: '100%',
            width: `${progressPercentage}%`,
            backgroundColor: getBarColor(progressPercentage),
            borderRadius: '6px',
            transition: 'width 0.5s ease-in-out'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: '#6b7280' }}>
          <span>Required: Rs.{optimizerData.required_monthly_saving}/mo</span>
          <span>Deadline: {optimizerData.target_date}</span>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveGoal}
        disabled={isSaving || savedSuccess}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '12px',
          backgroundColor: savedSuccess ? '#22c55e' : '#2563eb',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: savedSuccess ? 'default' : 'pointer',
          transition: 'background-color 0.2s'
        }}
      >
        {savedSuccess ? '✓ Goal Saved to Database' : isSaving ? 'Saving...' : 'Save Goal'}
      </button>
    </div>
  );
};

export default GoalOptimizerResult;