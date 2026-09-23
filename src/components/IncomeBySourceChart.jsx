import React from "react";

const CIRCUMFERENCE = 2 * Math.PI * 44; 

export const SOURCE_COLORS = {
  salary: { bg: "#E1F5EE", text: "#0F6E56", dot: "#3cca9d" },
  freelance: { bg: "#E6F1FB", text: "#185FA5", dot: "#23948e" },
  business: { bg: "#FAEEDA", text: "#854F0B", dot: "#e4ab56" },
  investment: { bg: "#EEEDFE", text: "#534AB7", dot: "#837be3" },
  other: { bg: "#FCEBEB", text: "#2823cc", dot: "#252bc1" },
  allowance:{ bg: "#FCEBEB", text: "#2823cc", dot: "#9ca456" }, 
};

export function colorForSource(source) {
  const key = (source || "").toLowerCase().replace(/\s+/g, "");
  return (SOURCE_COLORS[key] || SOURCE_COLORS.other).dot;
}

function DonutChart({ segments }) {
  if (!segments || segments.length === 0) {
    return <div className="donut-empty">No income data yet</div>;
  }

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
      <svg width={120} height={120} viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
        {segments.map((seg) => (
          <circle
            key={seg.label}
            cx={60} cy={60} r={44}
            fill="none"
            stroke={seg.color}
            strokeWidth={20}
            strokeDasharray={`${(seg.pct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={-(seg.offset / 100) * CIRCUMFERENCE}
            transform="rotate(-90 60 60)"
          />
        ))}
        <circle cx={60} cy={60} r={30} fill="#fff" />
      </svg>
      <div style={{ flex: 1, minWidth: 140 }}>
        {segments.map((seg) => (
          <div key={seg.label} className="donut-legend-row">
            <span className="donut-dot" style={{ background: seg.color }} />
            {seg.label}
            <span style={{ marginLeft: "auto", color: "#6b7280", fontSize: 12 }}>{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IncomeBySourceChart({ segments }) {
  return (
    <div className="income-card-panel">
      <div className="expense-card-title-row">
        <span className="expense-card-title">Income by Source</span>
      </div>
      <DonutChart segments={segments} />
    </div>
  );
}
