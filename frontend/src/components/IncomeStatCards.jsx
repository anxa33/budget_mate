import React from "react";
import { FaBriefcase, FaCalendar, FaTrophy, FaChartLine } from "react-icons/fa";

function StatCard({ icon, iconBg, iconColor, label, value, sub, subIcon }) {
  return (
    <div className="income-stat-card">
      <div
        className="income-stat-icon"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <div className="income-stat-label">{label}</div>
        <div className="income-stat-value">{value}</div>
        {sub && (
          <div
            className={`income-stat-sub ${
              subIcon === "up" ? "up" : subIcon === "down" ? "down" : ""
            }`}
          >
            {subIcon === "up" && <span>↑</span>}
            {subIcon === "down" && <span>↓</span>}
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export default function IncomeStatCards({ summary }) {
  return (
    <div className="income-stat-cards">
      <StatCard
        icon={<FaBriefcase />}
        iconBg="#E1F5EE"
        iconColor="#0F6E56"
        label="Total Income"
        value={summary ? `Rs. ${summary.total_income.toLocaleString()}` : "—"}
      />
      <StatCard
        icon={<FaCalendar />}
        iconBg="#E6F1FB"
        iconColor="#185FA5"
        label="This Month"
        value={summary ? `Rs. ${summary.this_month_income.toLocaleString()}` : "—"}
        sub={summary ? `${Math.abs(summary.this_month_change_pct)}% vs last month` : undefined}
        subIcon={summary ? (summary.this_month_change_pct >= 0 ? "up" : "down") : undefined}
      />
      <StatCard
        icon={<FaTrophy />}
        iconBg="#FAEEDA"
        iconColor="#854F0B"
        label="Highest Source"
        value={summary?.highest_source ? summary.highest_source.source : "—"}
        sub={
          summary?.highest_source
            ? `Rs. ${summary.highest_source.amount.toLocaleString()} (${summary.highest_source.percentage}%)`
            : undefined
        }
      />
      <StatCard
        icon={<FaChartLine />}
        iconBg="#EEEDFE"
        iconColor="#534AB7"
        label="Avg Monthly Income"
        value={summary ? `Rs. ${summary.avg_monthly_income.toLocaleString()}` : "—"}
        sub="Last 6 months"
      />
    </div>
  );
}
