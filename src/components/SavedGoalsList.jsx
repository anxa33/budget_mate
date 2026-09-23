import React from 'react';
import { Trash2, Plus } from 'lucide-react';

function getBarColor(percent) {
  if (percent >= 100) return '#22c55e';
  if (percent >= 50) return '#3b82f6';
  return '#f59e0b';
}

function SavedGoalCard({ goal, onDelete }) {
  const pct = goal.progress_percentage ?? 0;

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '16px 18px',
        marginBottom: 12,
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{goal.goal_name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Target: Rs.{Number(goal.target_amount).toLocaleString()} &middot; Saved: Rs.
            {Number(goal.current_savings).toLocaleString()}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 16,
              fontSize: 11,
              fontWeight: 700,
              backgroundColor: goal.status === 'Completed' ? '#dcfce7' : '#fef3c7',
              color: goal.status === 'Completed' ? '#15803d' : '#b45309',
            }}
          >
            {goal.status}
          </span>

          <button
            onClick={() => onDelete(goal.id)}
            title="Delete goal"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: 4,
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div style={{ margin: '12px 0 4px' }}>
        <div
          style={{
            height: 10,
            width: '100%',
            backgroundColor: '#e5e7eb',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              backgroundColor: getBarColor(pct),
              borderRadius: 6,
              transition: 'width 0.5s ease-in-out',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 12,
            color: '#64748b',
          }}
        >
          <span>{pct}% complete</span>
          {goal.deadline && <span>Deadline: {goal.deadline}</span>}
        </div>
      </div>
    </div>
  );
}

export default function SavedGoalsList({ goals, loading, onDelete, onAddGoal }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <h2 style={{ fontSize: 19, color: '#334155', margin: 0 }}>
          Your Saved Goals
        </h2>

        {/* <button
          type="button"
          onClick={onAddGoal}
          className="add-goal-button"
        > */}
          {/* <Plus size={16} />
          Add Goal
        </button> */}
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading saved goals...</p>
      ) : goals.length === 0 ? (
        <div
          style={{
            border: '1px dashed #cbd5e1',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
            color: '#4d5054',
            fontSize: 18,
          }}
        >
          No goals saved yet.
        </div>
      ) : (
        goals.map((g) => (
          <SavedGoalCard key={g.id} goal={g} onDelete={onDelete} />
        ))
      )}
    </div>
  );
}
