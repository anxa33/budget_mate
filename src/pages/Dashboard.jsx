import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import MonthlyOverviewChart from "../components/MonthlyOverviewChart";
import ExpensePieChart from "../components/ExpensePieChart";
import RecentTransactions from "../components/RecentTransactions";
import Navbar from "../components/Navbar";
import "./Dashboard.css";
import { FaBell } from "react-icons/fa";
import Recommendations from "./Recommendations";

function formatNPR(amount) {
  const value = Number(amount) || 0;
  return `NPR ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState([
    { label: "Total Balance", value: "NPR 0", change: "0%", changeDir: "up", color: "green", icon: "" },
    { label: "Total Income", value: "NPR 0", change: "0%", changeDir: "up", color: "blue", icon: "" },
    { label: "Total Expenses", value: "NPR 0", change: "0%", changeDir: "down", color: "red", icon: "" },
    { label: "Savings This Month", value: "NPR 0", change: "0%", changeDir: "up", color: "green", icon: "" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  const fetchDashboardSummary = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/dashboard-summary", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard summary");
      }

      const data = await response.json();

      setStats([
        {
          label: "Total Balance",
          value: formatNPR(data.total_balance),
          change: `${Math.abs(data.total_balance_change_pct)}%`,
          changeDir: data.total_balance_change_pct >= 0 ? "up" : "down",
          color: data.total_balance >= 0 ? "green" : "red",
          icon: "",
        },
        {
          label: "Total Income",
          value: formatNPR(data.total_income),
          change: `${Math.abs(data.total_income_change_pct)}%`,
          changeDir: data.total_income_change_pct >= 0 ? "up" : "down",
          color: "blue",
          icon: "",
        },
        {
          label: "Total Expenses",
          value: formatNPR(data.total_expenses),
          change: `${Math.abs(data.total_expenses_change_pct)}%`,
          changeDir: data.total_expenses_change_pct >= 0 ? "up" : "down",
          color: "red",
          icon: "",
        },
        {
          label: "Savings This Month",
          value: formatNPR(data.savings_this_month),
          change: `${Math.abs(data.savings_change_pct)}%`,
          changeDir: data.savings_change_pct >= 0 ? "up" : "down",
          color: data.savings_this_month >= 0 ? "green" : "red",
          icon: "",
        },
      ]);
    } catch (err) {
      console.error("Dashboard summary fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <Navbar onNavigate={onNavigate} />

      </div> 
      

      {/* Stat Cards */}
      <div className="stats-grid">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
      {loading && (
        <p style={{ fontSize: 12, color: "#9ca3af", margin: "-8px 0 12px" }}>
          Loading latest figures...
        </p>
      )}

      {/* Charts row */}
      <div className="charts-row">
        <div className="card chart-card">
          <h3 className="card-title">Monthly Overview</h3>
          <MonthlyOverviewChart />
        </div>
        {/* <div className="card chart-card">
          <h3 className="card-title">Expense by Category</h3>
          <ExpensePieChart />
        </div> */}
      </div>

      {/* Bottom row */}
      <div className="bottom-row">
        <div className="card transactions-card">
          <h3 className="card-title">Recent Transactions</h3>
          <RecentTransactions />
        </div>
        <div>
          {/* <Recommendations /> */}
        </div>
      </div>
    </div>
  );
}
