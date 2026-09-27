import React from "react";
import { FaWallet, FaCalendar, FaTrophy, FaChartLine } from "react-icons/fa";

function StatCard({ icon, iconBg, iconColor, label, value, sub, subIcon }) {
  return (
    <div className="expense-stat-card">
      <div
        className="expense-stat-icon"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <div className="expense-stat-label">{label}</div>
        <div className="expense-stat-value">{value}</div>
        {sub && (
          <div
            className={`expense-stat-sub ${
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

export default function ExpenseStatCards({ summary }) {
  return (
    <div className="expense-stat-cards">
      <StatCard
        icon={<FaWallet />}
        iconBg="#FCEBEB"
        iconColor="#A32D2D"
        label="Total Expenses"
        value={summary ? `Rs. ${summary.total_expenses.toLocaleString()}` : "—"}
      />
      <StatCard
        icon={<FaCalendar />}
        iconBg="#E6F1FB"
        iconColor="#185FA5"
        label="This Month"
        value={summary ? `Rs. ${summary.this_month_expenses.toLocaleString()}` : "—"}
        sub={summary ? `${Math.abs(summary.this_month_change_pct)}% vs last month` : undefined}
        subIcon={summary ? (summary.this_month_change_pct >= 0 ? "up" : "down") : undefined}
      />
      <StatCard
        icon={<FaTrophy />}
        iconBg="#FAEEDA"
        iconColor="#854F0B"
        label="Highest Category"
        value={summary?.highest_category ? summary.highest_category.category : "—"}
        sub={
          summary?.highest_category
            ? `Rs. ${summary.highest_category.amount.toLocaleString()} (${summary.highest_category.percentage}%)`
            : undefined
        }
      />
      <StatCard
        icon={<FaChartLine />}
        iconBg="#EEEDFE"
        iconColor="#534AB7"
        label="Avg Monthly Expense"
        value={summary ? `Rs. ${summary.avg_monthly_expense.toLocaleString()}` : "—"}
        sub="Last 6 months"
      />
    </div>
  );
}
