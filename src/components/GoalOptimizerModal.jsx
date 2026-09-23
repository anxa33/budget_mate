import React, { useState } from 'react';
import {
  Target,
  TrendingUp,
  AlertCircle,
  Calendar,
  ArrowRight,
  PieChart,
  X,
} from 'lucide-react';
import GoalOptimizerResult from './GoalPbar';

const API_BASE = 'http://127.0.0.1:8000';

const EMPTY_FORM = {
  goal_name: '',
  target_amount: '',
  target_date: '',
  current_savings: 0,
};

function getFeasibilityBadge(status) {
  switch (status) {
    case 'Achieved':
    case 'Achievable':
      return 'badge-achievable';

    case 'Challenging':
      return 'badge-challenging';

    case 'Difficult':
      return 'badge-difficult';

    default:
      return 'badge-default';
  }
}

// The Goal Optimizer (form + results + save-to-database progress bar),
// shown as a modal behind the Goals page's "Add Goal" button.
export default function GoalOptimizerModal({ isOpen, onClose, token, onGoalSaved }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setResult(null);
    setError(null);
    setFormData(EMPTY_FORM);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'target_amount' || name === 'current_savings'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/optimize-goal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to optimize goal');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="goal-optimizer-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="goal-optimizer-modal">
        <button
          type="button"
          className="goal-optimizer-close"
          onClick={handleClose}
          aria-label="Close"
        >
         X
        </button>

        {/* Header */}
        <div className="goal-header">
          <div>
            <h1>Financial Goal Optimizer</h1>
          </div>
        </div>

        <div className="goal-grid">

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="goal-form">

            <div className="form-group">
              <label>Goal Name</label>

              <input
                type="text"
                name="goal_name"
                required
                placeholder="e.g., Gift for Mom's Birthday"
                value={formData.goal_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Target Amount (Rs.)</label>

              <div className="input-wrapper">
                

                <input
                  type="number"
                  name="target_amount"
                  min="0.01"
                  step="any"
                  required
                  placeholder="Rs. 50000"
                  value={formData.target_amount || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Target Date</label>

              <div className="input-wrapper">
                <Calendar className="input-icon" />

                <input
                  type="date"
                  name="target_date"
                  required
                  value={formData.target_date}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Current Savings (Rs.)</label>

              <div className="input-wrapper">
                <div className="input-icon" />

                <input
                  type="number"
                  name="current_savings"
                  min="0"
                  step="any"
                  placeholder="Skip if none"
                
                  value={formData.current_savings || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="error-message">
                <AlertCircle />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="optimize-button">
              {loading ? 'Calculating...' : 'Run Optimization'}
              <ArrowRight />
            </button>

          </form>

          {/* Results */}
          <div className="results-container">

            {result ? (
              <div className="results-panel">

                {/* Result Header */}
                <div className="result-header">
                  <div>
                    <h3>{result.goal_name}</h3>
                    <p>{result.message}</p>
                  </div>

                  <span className={`feasibility-badge ${getFeasibilityBadge(result.feasibility)}`}>
                    {result.feasibility}
                  </span>
                </div>

                {/* Statistics */}
                <div className="goal-stats-grid">

                  <div className="goal-stat-card">
                    <p>Months Left</p>
                    <strong>{result.months_remaining}</strong>
                  </div>

                  <div className="goal-stat-card">
                    <p>Remaining Total</p>
                    <strong>Rs.{result.remaining_amount.toLocaleString()}</strong>
                  </div>

                  <div className="goal-stat-card required-saving">
                    <p>Required / Mo.</p>
                    <strong>Rs.{result.required_monthly_saving.toLocaleString()}</strong>
                  </div>

                  <div className="goal-stat-card">
                    <p>Avg Income / Mo.</p>
                    <strong>Rs.{result.average_monthly_income.toLocaleString()}</strong>
                  </div>

                  <div className="goal-stat-card">
                    <p>Avg Expense / Mo.</p>
                    <strong>Rs.{result.average_monthly_expense.toLocaleString()}</strong>
                  </div>

                  <div className="goal-stat-card current-saving">
                    <p>Current Saving / Mo.</p>
                    <strong>Rs.{result.current_monthly_saving.toLocaleString()}</strong>
                  </div>

                </div>

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="recommendations">
                    <h4>
                      <PieChart />
                      Recommended Expense Cutbacks
                      (15% Max per Category)
                    </h4>

                    <div className="recommendation-list">
                      {result.recommendations.map((item, idx) => (
                        <div key={idx} className="recommendation-item">
                          <span>{item.category}</span>
                          <strong>Rs.{item.suggested_reduction}/mo</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress bar + Save to database */}
                <div style={{ marginTop: 24 }}>
                  <GoalOptimizerResult
                    key={`${result.goal_name}-${result.target_date}-${result.target_amount}`}
                    optimizerData={result}
                    token={token}
                    onGoalSaved={() => {
                      onGoalSaved && onGoalSaved();
                      handleClose();
                    }}
                  />
                </div>

              </div>
            ) : (
              <div className="empty-result">
                <TrendingUp />
                <p>Enter your goal details to see optimization insights.</p>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
