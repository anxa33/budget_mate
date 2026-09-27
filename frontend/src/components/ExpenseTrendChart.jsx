// active
import React from "react";

function BarChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="chart-empty">No expense data yet</div>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const step = max / 5;
  const yLabels = [5, 4, 3, 2, 1, 0].map((n) => Math.round(step * n));
  const formatLabel = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : n);

  return (
    <div>
      <div style={{ display: "flex", gap: 4 }}>
        <div className="chart-y-labels">
          {yLabels.map((l, i) => (
            <span key={i}>{formatLabel(l)}</span>
          ))}
        </div>
        <div className="chart-bars">
          {data.map((d) => (
            <div key={d.month} className="chart-bar-col">
              <div
                className="chart-bar expense-bar"
                title={`${d.month}: Rs. ${d.value.toLocaleString()}`}
                style={{ height: `${(d.value / max) * 118}px` }}
              />
              <span className="chart-x-label">{d.month}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="chart-legend">
        <span className="chart-legend-swatch expense-swatch" />
        Expenses (Rs.)
      </div>
      
    </div>
  );
}

export default function ExpenseTrendChart({ data }) {
  return (
    <div className="expense-card">
      <div className="expense-card-title-row">
        <span className="expense-card-title">Expense Trend (Last 6 Months)</span>
      </div>
      <BarChart data={data} />
    </div>
  );
}
