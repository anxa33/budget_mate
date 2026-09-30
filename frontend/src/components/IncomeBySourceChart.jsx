import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

export const SOURCE_COLORS = {
  salary: { bg: "#E1F5EE", text: "#0F6E56", dot: "#3cca9d" },
  freelance: { bg: "#E6F1FB", text: "#185FA5", dot: "#23948e" },
  business: { bg: "#FAEEDA", text: "#854F0B", dot: "#e4ab56" },
  investment: { bg: "#EEEDFE", text: "#534AB7", dot: "#837be3" },
  other: { bg: "#FCEBEB", text: "#2823cc", dot: "#252bc1" },
  allowance: { bg: "#FCEBEB", text: "#2823cc", dot: "#9ca456" },
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
    <div
      style={{
        display: "flex",
        gap: 20,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div style={{ width: 120, height: 120 }}>
        <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={segments}
            dataKey="pct"
            dataValue="label"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
          >
              {segments.map((seg) => (
                <Cell
                  key={seg.label}
                  fill={seg.color}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ flex: 1, minWidth: 140,paddingLeft:22,paddingTop:20 }}>
        {segments.map((seg) => (
          <div key={seg.label} className="donut-legend-row">
            <span
              className="donut-dot"
              style={{ background: seg.color }}
            />

            {seg.label}

            <span
              style={{
                marginLeft: "auto",
                color: "#6b7280",
                fontSize: 12,
              }}
            >
              {seg.pct}%
            </span>
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
        <span className="expense-card-title">
          Income by Source
        </span>
      </div>

      <DonutChart segments={segments} />
    </div>
  );
}